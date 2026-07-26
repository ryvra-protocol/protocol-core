import {
  LedgerSettlementConflictError,
  LedgerSettlementTimeoutError,
  LedgerSettlementTransportError,
  LedgerSettlementUnavailableError,
  LedgerSettlementValidationError
} from "../errors.js";
import {
  toCanonicalAdvanceSettlementResult,
  toCanonicalPostTransactionResult,
  toCanonicalReconcileResult,
  toUpstreamAdvanceSettlementRequest,
  toUpstreamPostTransactionRequest,
  toUpstreamReconcileRequest
} from "../mapper.js";
import { executeWithRetry } from "../retry.js";
import { assertAdvanceSettlementInput, assertPostTransactionInput, assertReconcileInput } from "../validator.js";
import type { HttpLedgerSettlementAdapterConfig, LedgerSettlementAdapter } from "../types.js";

const isAbortError = (error: unknown): boolean => error instanceof Error && error.name === "AbortError";

export const createHttpLedgerSettlementAdapter = (config: HttpLedgerSettlementAdapterConfig): LedgerSettlementAdapter => {
  let consecutiveFailures = 0;
  let cooldownUntil = 0;

  const registerFailure = (): void => {
    if (!config.circuitBreaker) {
      return;
    }
    consecutiveFailures += 1;
    if (consecutiveFailures >= config.circuitBreaker.failureThreshold) {
      cooldownUntil = Date.now() + config.circuitBreaker.cooldownMs;
      consecutiveFailures = 0;
    }
  };

  const registerSuccess = (): void => {
    consecutiveFailures = 0;
    cooldownUntil = 0;
  };

  const execute = async (path: string, input: Record<string, unknown>, context?: { signal?: AbortSignal }) => {
    if (config.circuitBreaker && Date.now() < cooldownUntil) {
      throw new LedgerSettlementUnavailableError("Ledger-settlement adapter circuit breaker is cooling down.");
    }

    try {
      const output = await executeWithRetry(
        async () => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
          try {
            const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}${path}`, {
              method: "POST",
              headers: {
                "content-type": "application/json",
                "x-idempotency-key": String(input.idempotency_key ?? ""),
                "x-correlation-id": String(input.correlation_id ?? "")
              },
              body: JSON.stringify(input),
              signal: context?.signal ?? controller.signal
            });

            if (!response.ok) {
              if (response.status === 409) {
                const conflictBody = (await response.json().catch(() => ({}))) as { prior_result?: unknown };
                throw new LedgerSettlementConflictError("Ledger-settlement upstream conflict.", conflictBody.prior_result);
              }
              if (response.status >= 500 || response.status === 429 || response.status === 503) {
                throw new LedgerSettlementTransportError(
                  `Ledger-settlement upstream returned retryable HTTP status ${response.status}.`
                );
              }
              throw new LedgerSettlementValidationError(
                `Ledger-settlement upstream returned non-retryable HTTP status ${response.status}.`
              );
            }

            return (await response.json()) as Record<string, unknown>;
          } catch (error) {
            if (isAbortError(error)) {
              throw new LedgerSettlementTimeoutError();
            }
            if (
              error instanceof LedgerSettlementValidationError ||
              error instanceof LedgerSettlementTransportError ||
              error instanceof LedgerSettlementConflictError ||
              error instanceof LedgerSettlementUnavailableError
            ) {
              throw error;
            }
            throw new LedgerSettlementTransportError("Ledger-settlement transport failure.", true, { cause: error as Error });
          } finally {
            clearTimeout(timeout);
          }
        },
        config.retry,
        (error) => Boolean((error as { retryable?: boolean }).retryable)
      );
      registerSuccess();
      return output;
    } catch (error) {
      registerFailure();
      throw error;
    }
  };

  return {
    async postTransaction(input, context) {
      assertPostTransactionInput(input);

      const output = await execute("/transactions", toUpstreamPostTransactionRequest(input), context);
      return toCanonicalPostTransactionResult(output, {
        ledgerEventId: String(input.ledger_event_id ?? ""),
        referenceId: String(input.reference_id),
        postings: input.postings,
        createdAt: input.created_at ?? context?.now?.() ?? new Date().toISOString()
      });
    },

    async advanceSettlement(input, context) {
      assertAdvanceSettlementInput(input);

      const output = await execute("/settlements/advance", toUpstreamAdvanceSettlementRequest(input), context);
      return toCanonicalAdvanceSettlementResult(output, {
        referenceId: String(input.reference_id),
        nextState: String(input.next_state)
      });
    },

    async reconcile(input, context) {
      assertReconcileInput(input);

      const output = await execute("/reconcile", toUpstreamReconcileRequest(input), context);
      return toCanonicalReconcileResult(output, input);
    }
  };
};
