import { SettlementState, asLedgerEventId } from "@ryvra/contracts";

import { LedgerSettlementConflictError } from "../errors.js";
import { InMemoryIdempotencyCache, ledgerSettlementReplayKey } from "../idempotency.js";
import { assertNonDestructiveLedgerMutation } from "../invariant.js";
import { assertAdvanceSettlementInput, assertPostTransactionInput, assertReconcileInput } from "../validator.js";
import type {
  AdvanceSettlementResult,
  DeterministicLedgerSettlementAdapterConfig,
  LedgerSettlementAdapter,
  PostTransactionResult,
  ReconcileResult
} from "../types.js";

export const createDeterministicLedgerSettlementAdapter = (
  _config: DeterministicLedgerSettlementAdapterConfig
): LedgerSettlementAdapter => {
  const postCache = new InMemoryIdempotencyCache<PostTransactionResult>();
  const settleCache = new InMemoryIdempotencyCache<AdvanceSettlementResult>();
  const reconcileCache = new InMemoryIdempotencyCache<ReconcileResult>();

  const postByReference = new Map<string, { replayKey: string; result: PostTransactionResult }>();
  const settlementByReference = new Map<string, AdvanceSettlementResult>();

  return {
    async postTransaction(input, context) {
      assertPostTransactionInput(input);
      const replayKey = ledgerSettlementReplayKey(input.reference_id, input.idempotency_key);

      return postCache.dedupe(replayKey, async () => {
        const existing = postByReference.get(input.reference_id);
        if (existing && existing.replayKey !== replayKey) {
          throw new LedgerSettlementConflictError("Duplicate post conflict for reference_id with different idempotency_key.", existing.result);
        }

        const createdAt = input.created_at ?? context?.now?.() ?? new Date(0).toISOString();
        const next = {
          ledger_transaction: {
            ledger_event_id: input.ledger_event_id ?? asLedgerEventId(`evt_det_${input.reference_id}`),
            reference_id: input.reference_id,
            postings: input.postings,
            created_at: createdAt
          },
          settlement_state: SettlementState.accepted,
          duplicate_replay: false
        } as const;

        assertNonDestructiveLedgerMutation(existing?.result.ledger_transaction, next.ledger_transaction);

        postByReference.set(input.reference_id, { replayKey, result: next });
        return next;
      });
    },

    async advanceSettlement(input) {
      assertAdvanceSettlementInput(input);
      const replayKey = ledgerSettlementReplayKey(input.reference_id, input.idempotency_key);

      return settleCache.dedupe(replayKey, async () => {
        const result = {
          reference_id: input.reference_id,
          settlement_state: input.next_state,
          duplicate_replay: false
        };
        settlementByReference.set(input.reference_id, result);
        return result;
      });
    },

    async reconcile(input) {
      assertReconcileInput(input);
      const replayKey = ledgerSettlementReplayKey(input.reference_id, input.idempotency_key);
      return reconcileCache.dedupe(replayKey, async () => ({
        items: input.reference_ids.map((reference_id) => ({
          reference_id,
          settlement_state: settlementByReference.get(reference_id)?.settlement_state
        }))
      }));
    }
  };
};
