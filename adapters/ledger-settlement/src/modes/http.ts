import { SettlementState, asLedgerEventId } from "@ryvra/contracts";

import {
  LedgerSettlementConflictError,
  LedgerSettlementTimeoutError,
  LedgerSettlementTransportError,
  LedgerSettlementUnavailableError,
  LedgerSettlementValidationError
} from "../errors.js";
import {
  toCanonicalEnvelope,
  toCanonicalReconciliation,
  toCanonicalSettlementState,
  toCanonicalTransaction,
  toUpstreamAdvanceSettlementRequest,
  toUpstreamPostTransactionRequest,
  toUpstreamReconcileRequest
} from "../mapper.js";
import { executeWithRetry } from "../retry.js";
import {
  assertAdvanceSettlementInput,
  assertCanonicalEnvelope,
  assertNoLegacyDrift,
  assertObjectPayload,
  assertPostTransactionInput,
  assertReconcileInput,
  assertReconciliationOutput,
  assertSettlementState
} from "../validator.js";
import type { HttpLedgerSettlementAdapterConfig, LedgerSettlementAdapter } from "../types.js";

const isAbortError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  return error.name === "AbortError";
};

const createCircuit = (config: HttpLedgerSettlementAdapterConfig) => {
  let consecutiveFailures = 0;
  let cooldownUntil = 0;

  return {
    check() {
      if (config.circuitBreaker && Date.now() < cooldownUntil) {
        throw new LedgerSettlementUnavailableError("Ledger-settlement adapter circuit breaker is cooling down.");
      }
    },
    success() {
      consecutiveFailures = 0;
      cooldownUntil = 0;
    },
    failure() {
      if (!config.circuitBreaker) {
        return;
      }
      consecutiveFailures += 1;
      if (consecutiveFailures >= config.circuitBreaker.failureThreshold) {
        cooldownUntil = Date.now() + config.circuitBreaker.cooldownMs;
        consecutiveFailures = 0;
      }
    }
  };
};

export const createHttpLedgerSettlementAdapter = (config: HttpLedgerSettlementAdapterConfig): LedgerSettlementAdapter => {
  const circuit = createCircuit(config);

  const request = async (path: string, body: unknown, signal?: AbortSignal): Promise<Record<string, unknown>> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: signal ?? controller.signal
      });

      if (!response.ok) {
        if (response.status === 409) {
          const conflictBody = assertObjectPayload(await response.json().catch(() => ({})), "Conflict response");
          return { __conflict: true, ...conflictBody };
        }
        if (response.status === 503) {
          throw new LedgerSettlementUnavailableError();
        }
        if (response.status >= 500 || response.status === 429) {
          throw new LedgerSettlementTransportError(`Ledger-settlement upstream returned retryable HTTP status ${response.status}.`);
        }
        throw new LedgerSettlementValidationError(
          `Ledger-settlement upstream returned non-retryable HTTP status ${response.status}.`
        );
      }

      return assertObjectPayload(await response.json(), "Upstream response");
    } catch (error) {
      if (isAbortError(error)) {
        throw new LedgerSettlementTimeoutError();
      }
      if (
        error instanceof LedgerSettlementValidationError ||
        error instanceof LedgerSettlementUnavailableError ||
        error instanceof LedgerSettlementTransportError
      ) {
        throw error;
      }
      throw new LedgerSettlementTransportError("Ledger-settlement transport failure.", true, { cause: error as Error });
    } finally {
      clearTimeout(timeout);
    }
  };

  return {
    async postTransaction(input, context) {
      assertPostTransactionInput(input);
      circuit.check();

      try {
        const raw = await executeWithRetry(
          () => request("/transactions", toUpstreamPostTransactionRequest(input), context?.signal),
          config.retry,
          (error) => Boolean((error as { retryable?: boolean }).retryable)
        );

        const fallbackEnvelope = {
          event_id: context?.nextEventId?.() ?? asLedgerEventId("evt_http_post_1"),
          correlation_id: input.correlation_id,
          reference_id: input.reference_id,
          event_type: "ledger.transaction_created",
          timestamp: context?.now?.() ?? new Date().toISOString(),
          payload: { ledger_transaction: undefined as never }
        };

        if (raw.__conflict === true) {
          if (!raw.prior_result && !raw.priorResult) {
            throw new LedgerSettlementConflictError("Ledger-settlement conflict response missing prior_result payload.");
          }
          const prior = assertObjectPayload(raw.prior_result ?? raw.priorResult, "Conflict prior result");
          const transaction = toCanonicalTransaction(assertObjectPayload(prior.ledger_transaction, "Prior transaction"), {
            ledgerEventId: `${input.ledger_event_id ?? "evt_http_fallback"}`,
            referenceId: `${input.reference_id}`
          });
          const settlement_state = toCanonicalSettlementState(
            assertObjectPayload(prior, "Conflict prior result payload"),
            SettlementState.accepted
          );
          assertSettlementState(settlement_state);
          const envelope = toCanonicalEnvelope(
            assertObjectPayload(prior.envelope ?? {}, "Conflict prior envelope"),
            {
              ...fallbackEnvelope,
              payload: { ledger_transaction: transaction }
            }
          );
          assertCanonicalEnvelope(envelope);
          circuit.success();
          return { ledger_transaction: transaction, settlement_state, envelope };
        }

        assertNoLegacyDrift(raw);

        const transaction = toCanonicalTransaction(raw, {
          ledgerEventId: `${input.ledger_event_id ?? "evt_http_fallback"}`,
          referenceId: `${input.reference_id}`
        });

        const settlement_state = toCanonicalSettlementState(raw, SettlementState.accepted);
        assertSettlementState(settlement_state);

        const envelope = toCanonicalEnvelope(raw.envelope as Record<string, unknown> | undefined ?? {}, {
          ...fallbackEnvelope,
          payload: { ledger_transaction: transaction }
        });
        assertCanonicalEnvelope(envelope);

        const output = {
          ledger_transaction: transaction,
          settlement_state,
          envelope
        };

        circuit.success();
        return output;
      } catch (error) {
        circuit.failure();
        throw error;
      }
    },

    async advanceSettlement(input, context) {
      assertAdvanceSettlementInput(input);
      circuit.check();

      try {
        const raw = await executeWithRetry(
          () => request("/settlements/advance", toUpstreamAdvanceSettlementRequest(input), context?.signal),
          config.retry,
          (error) => Boolean((error as { retryable?: boolean }).retryable)
        );

        const settlement_state = toCanonicalSettlementState(raw, input.next_state);
        assertSettlementState(settlement_state);

        const envelope = toCanonicalEnvelope(raw.envelope as Record<string, unknown> | undefined ?? {}, {
          event_id: context?.nextEventId?.() ?? asLedgerEventId("evt_http_settlement_1"),
          correlation_id: input.correlation_id,
          reference_id: input.reference_id,
          event_type: `settlement.${settlement_state}`,
          timestamp: input.timestamp ?? context?.now?.() ?? new Date().toISOString(),
          payload: { state: settlement_state }
        });
        assertCanonicalEnvelope(envelope);

        circuit.success();
        return {
          reference_id: input.reference_id,
          settlement_state,
          envelope
        };
      } catch (error) {
        circuit.failure();
        throw error;
      }
    },

    async reconcile(input, context) {
      assertReconcileInput(input);
      circuit.check();

      try {
        const raw = await executeWithRetry(
          () => request("/reconcile", toUpstreamReconcileRequest(input), context?.signal),
          config.retry,
          (error) => Boolean((error as { retryable?: boolean }).retryable)
        );

        const output = toCanonicalReconciliation(raw, input);
        assertReconciliationOutput(output);

        circuit.success();
        return output;
      } catch (error) {
        circuit.failure();
        throw error;
      }
    }
  };
};
