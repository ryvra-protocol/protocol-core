import {
  asLedgerEventId,
  asPostingId,
  asReferenceId,
  type EventEnvelope,
  type LedgerTransaction,
  type ReconciliationReport,
  type SettlementState
} from "@ryvra/contracts";

import type {
  AdvanceSettlementInput,
  LedgerPostingInput,
  PostTransactionInput,
  ReconcileInput,
  ReconcileOutput
} from "./types.js";

export interface UpstreamPostTransactionRequest {
  ledger_event_id?: string;
  reference_id: string;
  correlation_id: string;
  idempotency_key: string;
  policy_version?: string;
  timestamp?: string;
  postings: Array<{
    posting_id?: string;
    account_id: string;
    asset_id: string;
    amount_minor: number;
    direction: "debit" | "credit";
  }>;
}

export interface UpstreamAdvanceSettlementRequest {
  reference_id: string;
  correlation_id: string;
  idempotency_key: string;
  next_state: SettlementState;
  timestamp?: string;
}

export interface UpstreamReconcileRequest {
  total_intents: number;
  duplicate_attempt_count: number;
  failed_transitions_count: number;
  decisions: Array<{ reference_id: string; decision: string }>;
  settlements: Array<{ reference_id: string; state: SettlementState }>;
}

export const toUpstreamPostTransactionRequest = (input: PostTransactionInput): UpstreamPostTransactionRequest => ({
  ledger_event_id: input.ledger_event_id,
  reference_id: input.reference_id,
  correlation_id: input.correlation_id,
  idempotency_key: input.idempotency_key,
  policy_version: input.policy_version,
  timestamp: input.timestamp,
  postings: input.postings.map((posting) => ({
    posting_id: posting.posting_id,
    account_id: posting.account_id,
    asset_id: posting.asset_id,
    amount_minor: posting.amount_minor,
    direction: posting.direction
  }))
});

export const toUpstreamAdvanceSettlementRequest = (input: AdvanceSettlementInput): UpstreamAdvanceSettlementRequest => ({
  reference_id: input.reference_id,
  correlation_id: input.correlation_id,
  idempotency_key: input.idempotency_key,
  next_state: input.next_state,
  timestamp: input.timestamp
});

export const toUpstreamReconcileRequest = (input: ReconcileInput): UpstreamReconcileRequest => ({
  total_intents: input.total_intents,
  duplicate_attempt_count: input.duplicate_attempt_count,
  failed_transitions_count: input.failed_transitions_count,
  decisions: input.decisions.map((item) => ({ reference_id: item.reference_id, decision: item.decision })),
  settlements: input.settlements.map((item) => ({ reference_id: item.reference_id, state: item.state }))
});

const toPosting = (posting: Record<string, unknown>, fallbackPostingId: string): LedgerPostingInput => ({
  posting_id: asPostingId(`${posting.posting_id ?? posting.postingId ?? fallbackPostingId}`),
  account_id: `${posting.account_id ?? posting.accountId ?? ""}` as LedgerPostingInput["account_id"],
  asset_id: `${posting.asset_id ?? posting.assetId ?? ""}` as LedgerPostingInput["asset_id"],
  amount_minor: Number(posting.amount_minor ?? posting.amountMinor ?? 0),
  direction: `${posting.direction ?? "debit"}` as LedgerPostingInput["direction"]
});

export const toCanonicalTransaction = (
  payload: Record<string, unknown>,
  fallback: { ledgerEventId: string; referenceId: string }
): LedgerTransaction => {
  const rawPostings = Array.isArray(payload.postings) ? payload.postings : [];

  return {
    ledger_event_id: asLedgerEventId(`${payload.ledger_event_id ?? payload.ledgerEventId ?? fallback.ledgerEventId}`),
    reference_id: asReferenceId(`${payload.reference_id ?? payload.referenceId ?? fallback.referenceId}`),
    postings: rawPostings.map((posting, index) =>
      toPosting((posting as Record<string, unknown>) ?? {}, `pst_fallback_${index + 1}`)
    ) as LedgerTransaction["postings"],
    created_at: `${payload.created_at ?? payload.createdAt ?? new Date(0).toISOString()}`
  };
};

export const toCanonicalSettlementState = (payload: Record<string, unknown>, fallback: SettlementState): SettlementState =>
  `${payload.settlement_state ?? payload.settlementState ?? payload.state ?? fallback}` as SettlementState;

export const toCanonicalEnvelope = <TPayload>(
  payload: Record<string, unknown>,
  fallback: EventEnvelope<TPayload>
): EventEnvelope<TPayload> => ({
  event_id: (payload.event_id ?? payload.eventId ?? fallback.event_id) as EventEnvelope<TPayload>["event_id"],
  correlation_id: (payload.correlation_id ?? payload.correlationId ?? fallback.correlation_id) as EventEnvelope<TPayload>["correlation_id"],
  reference_id: (payload.reference_id ?? payload.referenceId ?? fallback.reference_id) as EventEnvelope<TPayload>["reference_id"],
  event_type: `${payload.event_type ?? payload.eventType ?? fallback.event_type}`,
  timestamp: `${payload.timestamp ?? fallback.timestamp}`,
  payload: (payload.payload as TPayload | undefined) ?? fallback.payload
});

export const toCanonicalReconciliation = (payload: Record<string, unknown>, fallback: ReconcileInput): ReconcileOutput => {
  const unreconciled = Array.isArray(payload.unreconciled_items)
    ? payload.unreconciled_items
    : Array.isArray(payload.unreconciledItems)
      ? payload.unreconciledItems
      : [];

  const report: ReconciliationReport = {
    total_intents: Number(payload.total_intents ?? payload.totalIntents ?? fallback.total_intents),
    allowed_count: Number(payload.allowed_count ?? payload.allowedCount ?? 0),
    denied_count: Number(payload.denied_count ?? payload.deniedCount ?? 0),
    finalized_count: Number(payload.finalized_count ?? payload.finalizedCount ?? 0),
    reconciled_count: Number(payload.reconciled_count ?? payload.reconciledCount ?? 0),
    failed_transitions_count: Number(
      payload.failed_transitions_count ?? payload.failedTransitionsCount ?? fallback.failed_transitions_count
    ),
    duplicate_attempt_count: Number(
      payload.duplicate_attempt_count ?? payload.duplicateAttemptCount ?? fallback.duplicate_attempt_count
    ),
    unreconciled_items: unreconciled.map((item) => {
      const record = item as Record<string, unknown>;
      return {
        reference_id: asReferenceId(`${record.reference_id ?? record.referenceId ?? ""}`),
        reason: `${record.reason ?? "missing_settlement"}`
      };
    })
  };

  return { report };
};
