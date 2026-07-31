import { asPolicyVersion, type PolicyRiskThresholdsConfig, type PolicyVersion } from "@ryvra/contracts";
import {
  createPolicyRiskAdapter,
  type PolicyRiskAdapter,
  type PolicyRiskAdapterConfig,
  type PolicyRiskMode
} from "@ryvra/policy-risk-adapter";

const DEFAULT_POLICY_VERSION = asPolicyVersion("policy-2026-01");
const DEFAULT_TIMEOUT_MS = 1500;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_DELAY_MS = 50;
const DEFAULT_FAILURE_THRESHOLD = 3;
const DEFAULT_COOLDOWN_MS = 1000;

const parseInteger = (raw: string | undefined, fallback: number, field: string): number => {
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${field} must be a non-negative integer.`);
  }
  return parsed;
};

export interface PolicyRiskRuntime {
  mode: PolicyRiskMode;
  policyVersion: PolicyVersion;
  adapter: PolicyRiskAdapter;
}

export const loadPolicyRiskAdapterConfig = (
  env: NodeJS.ProcessEnv = process.env,
  thresholds?: PolicyRiskThresholdsConfig
): PolicyRiskAdapterConfig => {
  const mode = (env.POLICY_RISK_MODE ?? "deterministic") as PolicyRiskMode;

  if (mode === "deterministic") {
    return {
      mode,
      policyVersion: DEFAULT_POLICY_VERSION,
      maxAllowedAmountMinor: thresholds?.maxAllowedAmountMinor ?? 1_000_000,
      maxAllowedRiskScore: thresholds?.maxAllowedRiskScore ?? 70
    };
  }

  if (mode === "http") {
    const baseUrl = env.POLICY_RISK_BASE_URL;
    if (!baseUrl) {
      throw new Error("POLICY_RISK_BASE_URL is required when POLICY_RISK_MODE=http.");
    }

    return {
      mode,
      baseUrl,
      timeoutMs: parseInteger(env.POLICY_RISK_TIMEOUT_MS, DEFAULT_TIMEOUT_MS, "POLICY_RISK_TIMEOUT_MS"),
      retry: {
        maxRetries: parseInteger(env.POLICY_RISK_MAX_RETRIES, DEFAULT_MAX_RETRIES, "POLICY_RISK_MAX_RETRIES"),
        baseDelayMs: parseInteger(
          env.POLICY_RISK_RETRY_BASE_DELAY_MS,
          DEFAULT_RETRY_BASE_DELAY_MS,
          "POLICY_RISK_RETRY_BASE_DELAY_MS"
        ),
        jitterMs: 0
      },
      circuitBreaker: {
        failureThreshold: parseInteger(
          env.POLICY_RISK_FAILURE_THRESHOLD,
          DEFAULT_FAILURE_THRESHOLD,
          "POLICY_RISK_FAILURE_THRESHOLD"
        ),
        cooldownMs: parseInteger(env.POLICY_RISK_COOLDOWN_MS, DEFAULT_COOLDOWN_MS, "POLICY_RISK_COOLDOWN_MS")
      }
    };
  }

  throw new Error("POLICY_RISK_MODE must be deterministic or http.");
};

export const createPolicyRiskRuntime = (
  env: NodeJS.ProcessEnv = process.env,
  thresholds?: PolicyRiskThresholdsConfig
): PolicyRiskRuntime => {
  const config = loadPolicyRiskAdapterConfig(env, thresholds);
  return {
    mode: config.mode,
    policyVersion: config.mode === "deterministic" ? config.policyVersion : DEFAULT_POLICY_VERSION,
    adapter: createPolicyRiskAdapter(config)
  };
};
