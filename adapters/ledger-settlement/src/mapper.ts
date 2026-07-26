import { asLedgerEventId, asReferenceId } from "@ryvra/contracts";

import { assertSettlementState } from "./validator.js";
import type {
  AdvanceSettlementInput,
  PostTransactionInput,
  ReconcileInput,
  ReconcileResult
} from "./types.js";

export interface UpstreamPostTransactionResponse {
  ledger_event_id?: string;
  reference_id?: string;
  postings?: PostTransactionInput["postings"];
  created_at?: string;
  settlement_state?: string;
  duplicate_replay?: boolean;
  [key: string]: unknown;
}

export interface UpstreamAdvanceSettlementResponse {
  reference_id?: string;
  settlement_state?: string;
  duplicate_replay?: boolean;
  [key: string]: unknown;
}

export interface UpstreamReconcileResponse {
  items?: Array<{ reference_id: string; settlement_state?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export const toUpstreamPostTransactionRequest = (input: PostTransactionInput) => ({
  ledger_event_id: input.ledger_event_id,
  reference_id: input.reference_id,
  correlation_id: input.correlation_id,
  idempotency_key: input.idempotency_key,
  policy_version: input.policy_version,
  created_at: input.created_at,
  postings: input.postings.map((posting) => ({
    posting_id: posting.posting_id,
    account_id: posting.account_id,
    asset_id: posting.asset_id,
    amount_minor: posting.amount_minor,
    direction: posting.direction
  }))
});

export const toCanonicalPostTransactionResult = (
  payload: UpstreamPostTransactionResponse,
  fallback: { ledgerEventId: string; referenceId: string; createdAt: string; postings: PostTransactionInput["postings"] }
) => ({
  ledger_transaction: {
    ledger_event_id: asLedgerEventId(payload.ledger_event_id ?? fallback.ledgerEventId),
    reference_id: asReferenceId(payload.reference_id ?? fallback.referenceId),
    postings: (payload.postings ?? fallback.postings).map((posting) => ({
      posting_id: posting.posting_id,
      account_id: posting.account_id,
      asset_id: posting.asset_id,
      amount_minor: posting.amount_minor,
      direction: posting.direction
    })) as PostTransactionInput["postings"],
    created_at: payload.created_at ?? fallback.createdAt
  },
  settlement_state: assertSettlementState(payload.settlement_state ?? "accepted"),
  duplicate_replay: payload.duplicate_replay === true
});

export const toUpstreamAdvanceSettlementRequest = (input: AdvanceSettlementInput) => ({
  reference_id: input.reference_id,
  correlation_id: input.correlation_id,
  idempotency_key: input.idempotency_key,
  policy_version: input.policy_version,
  next_state: input.next_state,
  transitioned_at: input.transitioned_at
});

export const toCanonicalAdvanceSettlementResult = (
  payload: UpstreamAdvanceSettlementResponse,
  fallback: { referenceId: string; nextState: string }
) => ({
  reference_id: asReferenceId(payload.reference_id ?? fallback.referenceId),
  settlement_state: assertSettlementState(payload.settlement_state ?? fallback.nextState),
  duplicate_replay: payload.duplicate_replay === true
});

export const toUpstreamReconcileRequest = (input: ReconcileInput) => ({
  reference_ids: input.reference_ids,
  correlation_id: input.correlation_id,
  idempotency_key: input.idempotency_key,
  reference_id: input.reference_id,
  policy_version: input.policy_version
});

export const toCanonicalReconcileResult = (payload: UpstreamReconcileResponse, fallback: ReconcileInput): ReconcileResult => ({
  items: (payload.items ?? fallback.reference_ids.map((reference_id) => ({ reference_id }))).map((item) => ({
    reference_id: asReferenceId(item.reference_id),
    settlement_state: item.settlement_state ? assertSettlementState(item.settlement_state) : undefined
  }))
});
