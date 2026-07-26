import type {
  AssetId,
  CorrelationId,
  IdempotencyKey,
  PolicyDecisionInput,
  PolicyDecisionOutput,
  PolicyVersion
} from "@ryvra/contracts";

export type PolicyRiskMode = "deterministic" | "http";

export interface PolicyDecisionEvaluateInput extends PolicyDecisionInput {
  correlation_id: CorrelationId;
  idempotency_key: IdempotencyKey;
  risk_score: number;
}

export interface PolicyRiskAdapterContext {
  now?: () => string;
  signal?: AbortSignal;
  isAssetRestricted?: (assetId: AssetId) => boolean;
}

export interface PolicyRiskAdapter {
  evaluate(input: PolicyDecisionEvaluateInput, context?: PolicyRiskAdapterContext): Promise<PolicyDecisionOutput>;
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

export interface DeterministicPolicyRiskAdapterConfig {
  mode: "deterministic";
  policyVersion: PolicyVersion;
  maxAllowedAmountMinor: number;
  maxAllowedRiskScore: number;
}

export interface HttpPolicyRiskAdapterConfig {
  mode: "http";
  baseUrl: string;
  timeoutMs: number;
  retry: RetryConfig;
  circuitBreaker?: CircuitBreakerLiteConfig;
}

export type PolicyRiskAdapterConfig = DeterministicPolicyRiskAdapterConfig | HttpPolicyRiskAdapterConfig;
