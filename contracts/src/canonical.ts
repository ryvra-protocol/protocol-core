export const CANONICAL_ID_FIELDS = [
  "account_id",
  "asset_id",
  "ledger_event_id",
  "posting_id",
  "reference_id",
  "idempotency_key",
  "policy_version",
  "correlation_id"
] as const;

export const CANONICAL_EVENT_ENVELOPE_FIELDS = [
  "event_id",
  "correlation_id",
  "reference_id",
  "event_type",
  "timestamp",
  "payload"
] as const;
