import {
  SettlementState,
  asLedgerEventId,
  asPostingId,
  type EventEnvelope,
  type LedgerTransaction,
  type ReferenceId
} from "@ryvra/contracts";

import { LedgerSettlementConflictError, LedgerSettlementValidationError } from "../errors.js";
import { InMemoryIdempotencyCache, ledgerReplayKey } from "../idempotency.js";
import {
  assertAdvanceSettlementInput,
  assertCanonicalEnvelope,
  assertPostTransactionInput,
  assertReconcileInput,
  assertReconciliationOutput,
  assertSettlementState
} from "../validator.js";
import type {
  AdvanceSettlementOutput,
  DeterministicLedgerSettlementAdapterConfig,
  LedgerSettlementAdapter,
  PostTransactionOutput,
  ReconcileOutput
} from "../types.js";

const validTransition = (from: SettlementState | undefined, to: SettlementState): boolean => {
  if (from === undefined) {
    return to === SettlementState.accepted || to === SettlementState.failed;
  }
  if (from === to) {
    return true;
  }

  if (from === SettlementState.accepted) {
    return [SettlementState.executed, SettlementState.finalized, SettlementState.failed].includes(to);
  }

  if (from === SettlementState.executed) {
    return [SettlementState.finalized, SettlementState.failed].includes(to);
  }

  if (from === SettlementState.finalized) {
    return [SettlementState.reconciled, SettlementState.failed].includes(to);
  }

  return false;
};

export const createDeterministicLedgerSettlementAdapter = (
  _config: DeterministicLedgerSettlementAdapterConfig
): LedgerSettlementAdapter => {
  const transactionsByReference = new Map<ReferenceId, LedgerTransaction>();
  const settlementByReference = new Map<ReferenceId, SettlementState>();
  const idempotencyByReference = new Map<ReferenceId, string>();
  const postCache = new InMemoryIdempotencyCache<PostTransactionOutput>();
  const advanceCache = new InMemoryIdempotencyCache<AdvanceSettlementOutput>();

  return {
    async postTransaction(input, context) {
      assertPostTransactionInput(input);
      const key = ledgerReplayKey("post", input.reference_id, input.idempotency_key);

      return postCache.dedupe(key, async () => {
        const existing = transactionsByReference.get(input.reference_id);
        if (existing) {
          if (idempotencyByReference.get(input.reference_id) !== `${input.idempotency_key}`) {
            throw new LedgerSettlementConflictError(
              "Ledger transaction already exists for reference_id with a different idempotency_key."
            );
          }
          return {
            ledger_transaction: existing,
            settlement_state: settlementByReference.get(input.reference_id) ?? SettlementState.accepted,
            envelope: {
              event_id: context?.nextEventId?.() ?? asLedgerEventId("evt_post_duplicate"),
              correlation_id: input.correlation_id,
              reference_id: input.reference_id,
              event_type: "ledger.transaction_created",
              timestamp: context?.now?.() ?? new Date(0).toISOString(),
              payload: { ledger_transaction: existing }
            }
          };
        }

        const postings = input.postings.map((posting, index) => ({
          posting_id: posting.posting_id ?? context?.nextPostingId?.() ?? asPostingId(`pst_${index + 1}`),
          account_id: posting.account_id,
          asset_id: posting.asset_id,
          amount_minor: posting.amount_minor,
          direction: posting.direction
        })) as LedgerTransaction["postings"];

        const ledger_transaction: LedgerTransaction = {
          ledger_event_id: input.ledger_event_id ?? context?.nextEventId?.() ?? asLedgerEventId("evt_ledger_1"),
          reference_id: input.reference_id,
          postings,
          created_at: input.timestamp ?? context?.now?.() ?? new Date(0).toISOString()
        };

        transactionsByReference.set(input.reference_id, ledger_transaction);
        settlementByReference.set(input.reference_id, SettlementState.accepted);
        idempotencyByReference.set(input.reference_id, `${input.idempotency_key}`);

        const envelope: EventEnvelope<{ ledger_transaction: LedgerTransaction }> = {
          event_id: context?.nextEventId?.() ?? asLedgerEventId("evt_post_1"),
          correlation_id: input.correlation_id,
          reference_id: input.reference_id,
          event_type: "ledger.transaction_created",
          timestamp: context?.now?.() ?? new Date(0).toISOString(),
          payload: { ledger_transaction }
        };

        assertCanonicalEnvelope(envelope);

        return {
          ledger_transaction,
          settlement_state: SettlementState.accepted,
          envelope
        };
      });
    },

    async advanceSettlement(input, context) {
      assertAdvanceSettlementInput(input);
      assertSettlementState(input.next_state);
      const key = ledgerReplayKey("advance", input.reference_id, input.idempotency_key);

      return advanceCache.dedupe(key, async () => {
        const previous = settlementByReference.get(input.reference_id);
        if (!validTransition(previous, input.next_state)) {
          throw new LedgerSettlementValidationError(
            `Invalid settlement transition from ${previous ?? "undefined"} to ${input.next_state}.`
          );
        }

        if (input.next_state === SettlementState.finalized && !transactionsByReference.has(input.reference_id)) {
          throw new LedgerSettlementValidationError("Cannot finalize settlement without an existing ledger transaction.");
        }

        settlementByReference.set(input.reference_id, input.next_state);

        const envelope: EventEnvelope<{ state: SettlementState }> = {
          event_id: context?.nextEventId?.() ?? asLedgerEventId("evt_settlement_1"),
          correlation_id: input.correlation_id,
          reference_id: input.reference_id,
          event_type: `settlement.${input.next_state}`,
          timestamp: input.timestamp ?? context?.now?.() ?? new Date(0).toISOString(),
          payload: { state: input.next_state }
        };
        assertCanonicalEnvelope(envelope);

        return {
          reference_id: input.reference_id,
          settlement_state: input.next_state,
          envelope
        };
      });
    },

    async reconcile(input) {
      assertReconcileInput(input);

      const settlementByRef = new Map(input.settlements.map((entry) => [entry.reference_id, entry.state]));
      const unreconciled_items: ReconcileOutput["report"]["unreconciled_items"] = [];

      for (const decision of input.decisions) {
        const settlement = settlementByRef.get(decision.reference_id);
        if (decision.decision === "DENY") {
          continue;
        }
        if (settlement !== SettlementState.reconciled) {
          unreconciled_items.push({
            reference_id: decision.reference_id,
            reason: settlement ?? "missing_settlement"
          });
        }
      }

      unreconciled_items.sort((a, b) => `${a.reference_id}`.localeCompare(`${b.reference_id}`));

      const output: ReconcileOutput = {
        report: {
          total_intents: input.total_intents,
          allowed_count: input.decisions.filter((decision) => decision.decision === "ALLOW").length,
          denied_count: input.decisions.filter((decision) => decision.decision === "DENY").length,
          finalized_count: input.settlements.filter((settlement) => settlement.state === SettlementState.finalized).length,
          reconciled_count: input.settlements.filter((settlement) => settlement.state === SettlementState.reconciled).length,
          failed_transitions_count: input.failed_transitions_count,
          duplicate_attempt_count: input.duplicate_attempt_count,
          unreconciled_items
        }
      };

      assertReconciliationOutput(output);
      return output;
    }
  };
};
