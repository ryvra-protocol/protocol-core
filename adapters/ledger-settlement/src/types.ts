import type {
  CorrelationId,
  EventEnvelope,
  IdempotencyKey,
  LedgerEventId,
  LedgerPosting,
  LedgerTransaction,
  PolicyVersion,
  ReferenceId,
  SettlementState
} from "@ryvra/contracts";

export type LedgerSettlementMode = "deterministic" | "http";

export interface AdapterMetadata {
  reference_id: ReferenceId;
  correlation_id: CorrelationId;
  idempotency_key: IdempotencyKey;
  policy_version?: PolicyVersion;
  ledger_event_id?: LedgerEventId;
}

export interface LedgerSettlementAdapterContext {
  now?: () => string;
  signal?: AbortSignal;
}

export interface PostTransactionInput extends AdapterMetadata {
  postings: [LedgerPosting, LedgerPosting, ...LedgerPosting[]];
  created_at?: string;
}

export interface PostTransactionResult {
  ledger_transaction: LedgerTransaction;
  settlement_state: SettlementState;
  duplicate_replay: boolean;
}

export interface AdvanceSettlementInput extends AdapterMetadata {
  next_state: SettlementState;
  transitioned_at?: string;
}

export interface AdvanceSettlementResult {
  reference_id: ReferenceId;
  settlement_state: SettlementState;
  duplicate_replay: boolean;
}

export interface ReconcileInput extends AdapterMetadata {
  reference_ids: ReferenceId[];
}

export interface ReconcileItem {
  reference_id: ReferenceId;
  settlement_state?: SettlementState;
}

export interface ReconcileResult {
  items: ReconcileItem[];
}

export interface LedgerSettlementAdapter {
  postTransaction(input: PostTransactionInput, context?: LedgerSettlementAdapterContext): Promise<PostTransactionResult>;
  advanceSettlement(input: AdvanceSettlementInput, context?: LedgerSettlementAdapterContext): Promise<AdvanceSettlementResult>;
  reconcile(input: ReconcileInput, context?: LedgerSettlementAdapterContext): Promise<ReconcileResult>;
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

export type LedgerSettlementAdapterConfig = DeterministicLedgerSettlementAdapterConfig | HttpLedgerSettlementAdapterConfig;

export type SettlementEnvelope = EventEnvelope<{ settlement_state: SettlementState }>;
