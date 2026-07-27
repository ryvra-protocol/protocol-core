import type {
  CorrelationId,
  EventEnvelope,
  IdempotencyKey,
  PaymentIntent,
  ReferenceId,
  SettlementState
} from "@ryvra/contracts";
import { PaymentIntentState } from "@ryvra/contracts";

export type PayMode = "deterministic" | "http";

export type PayCallbackType = "authorized" | "executing" | "settled" | "failed" | "reversed";

export interface PayCreateInput {
  reference_id: ReferenceId;
  idempotency_key: IdempotencyKey;
  correlation_id: CorrelationId;
  amount_minor: number;
  account_id: PaymentIntent["account_id"];
  asset_id: PaymentIntent["asset_id"];
}

export interface PayCallbackInput {
  reference_id: ReferenceId;
  idempotency_key: IdempotencyKey;
  correlation_id: CorrelationId;
  event_type: PayCallbackType;
  provider_event_id?: string;
  payload?: Record<string, unknown>;
  raw_body?: string;
  signature?: string;
}

export interface PayQueryInput {
  reference_id: ReferenceId;
  idempotency_key: IdempotencyKey;
  correlation_id: CorrelationId;
}

export interface PayAdapterContext {
  now?: () => string;
  nowMs?: () => number;
  signal?: AbortSignal;
}

export interface PayResult {
  intent: PaymentIntent;
  settlement_state?: SettlementState;
  duplicate_detected: boolean;
  reward_eligible: boolean;
}

export interface PayQueryResult extends PayResult {
  callbacks_processed: number;
}

export interface PayAdapter {
  createPaymentIntent(input: PayCreateInput, context?: PayAdapterContext): Promise<PayResult>;
  handleProviderCallback(input: PayCallbackInput, context?: PayAdapterContext): Promise<PayResult>;
  queryPaymentStatus(input: PayQueryInput, context?: PayAdapterContext): Promise<PayQueryResult>;
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

export interface DeterministicPayAdapterConfig {
  mode: "deterministic";
  callbackDedupeTtlMs: number;
  webhookSecret?: string;
}

export interface HttpPayAdapterConfig {
  mode: "http";
  baseUrl: string;
  timeoutMs: number;
  retry: RetryConfig;
  callbackDedupeTtlMs: number;
  webhookSecret?: string;
  circuitBreaker?: CircuitBreakerLiteConfig;
}

export type PayAdapterConfig = DeterministicPayAdapterConfig | HttpPayAdapterConfig;

export interface CallbackDedupeStore {
  seen(key: string, nowMs: number): boolean;
  mark(key: string, nowMs: number): void;
}

export interface PayRecord {
  intent: PaymentIntent;
  settlement_state?: SettlementState;
  callbacks_processed: number;
  reward_eligible: boolean;
  timed_out_pending_callback: boolean;
  state: PaymentIntentState;
  applied_side_effects: Set<string>;
}

export interface OutboxMessage<TPayload = unknown> {
  envelope: EventEnvelope<TPayload>;
  delivery_key: string;
  delivered: boolean;
}
