import type {
  CorrelationId,
  EventEnvelope,
  IdempotencyKey,
  LedgerEventId,
  LedgerPosting,
  LedgerTransaction,
  PolicyVersion,
  PostingId,
  ReconciliationReport,
  ReferenceId,
  SettlementState
} from "@ryvra/contracts";

export type LedgerSettlementMode = "deterministic" | "http";

export interface LedgerSettlementAdapterContext {
  now?: () => string;
  signal?: AbortSignal;
  nextEventId?: () => LedgerEventId;
  nextPostingId?: () => PostingId;
}

export interface PostTransactionInput {
  ledger_event_id?: LedgerEventId;
  reference_id: ReferenceId;
  correlation_id: CorrelationId;
  idempotency_key: IdempotencyKey;
  policy_version?: PolicyVersion;
  timestamp?: string;
  postings: LedgerPostingInput[];
}

export interface LedgerPostingInput {
  posting_id?: PostingId;
  account_id: LedgerPosting["account_id"];
  asset_id: LedgerPosting["asset_id"];
  amount_minor: number;
  direction: LedgerPosting["direction"];
}

export interface PostTransactionOutput {
  ledger_transaction: LedgerTransaction;
  settlement_state: SettlementState;
  envelope: EventEnvelope<{ ledger_transaction: LedgerTransaction }>;
}

export interface AdvanceSettlementInput {
  reference_id: ReferenceId;
  correlation_id: CorrelationId;
  idempotency_key: IdempotencyKey;
  next_state: SettlementState;
  timestamp?: string;
}

export interface AdvanceSettlementOutput {
  reference_id: ReferenceId;
  settlement_state: SettlementState;
  envelope: EventEnvelope<{ state: SettlementState }>;
}

export interface ReconcileInput {
  total_intents: number;
  duplicate_attempt_count: number;
  failed_transitions_count: number;
  decisions: Array<{
    reference_id: ReferenceId;
    decision: string;
  }>;
  settlements: Array<{
    reference_id: ReferenceId;
    state: SettlementState;
  }>;
}

export interface ReconcileOutput {
  report: ReconciliationReport;
}

export interface LedgerSettlementAdapter {
  postTransaction(input: PostTransactionInput, context?: LedgerSettlementAdapterContext): Promise<PostTransactionOutput>;
  advanceSettlement(input: AdvanceSettlementInput, context?: LedgerSettlementAdapterContext): Promise<AdvanceSettlementOutput>;
  reconcile(input: ReconcileInput, context?: LedgerSettlementAdapterContext): Promise<ReconcileOutput>;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  jitterMs: number;
}

export interface CircuitBreakerLiteConfig {
  failureThreshold: number;
  cooldownMs: number;
}

export interface DeterministicLedgerSettlementAdapterConfig {
  mode: "deterministic";
}

export interface HttpLedgerSettlementAdapterConfig {
  mode: "http";
  baseUrl: string;
  timeoutMs: number;
  retry: RetryConfig;
  circuitBreaker?: CircuitBreakerLiteConfig;
}

export type LedgerSettlementAdapterConfig =
  | DeterministicLedgerSettlementAdapterConfig
  | HttpLedgerSettlementAdapterConfig;
