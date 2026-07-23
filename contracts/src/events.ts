import type { AccountId, AssetId, CorrelationId, LedgerEventId, ReferenceId } from "./ids.js";

export interface ContributionEvent {
  contribution_id: LedgerEventId;
  account_id: AccountId;
  reference_id: ReferenceId;
  asset_id: AssetId;
  amount_minor: number;
  points_awarded: number;
  scoring_policy: string;
  created_at: string;
}

export interface ReconciliationReport {
  total_intents: number;
  allowed_count: number;
  denied_count: number;
  finalized_count: number;
  reconciled_count: number;
  failed_transitions_count: number;
  duplicate_attempt_count: number;
  unreconciled_items: Array<{
    reference_id: ReferenceId;
    reason: string;
  }>;
}

export interface EventEnvelope<TPayload> {
  event_id: LedgerEventId;
  correlation_id: CorrelationId;
  reference_id: ReferenceId;
  event_type: string;
  timestamp: string;
  payload: TPayload;
}
