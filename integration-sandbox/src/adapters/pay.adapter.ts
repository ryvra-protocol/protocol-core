import {
  createPayAdapter,
  type PayAdapter,
  type PayAdapterConfig,
  type PayMode
} from "@ryvra/pay-adapter";

const DEFAULT_TIMEOUT_MS = 1500;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_DELAY_MS = 50;
const DEFAULT_FAILURE_THRESHOLD = 3;
const DEFAULT_COOLDOWN_MS = 1000;
const DEFAULT_CALLBACK_DEDUPE_TTL_MS = 300_000;

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

export interface PayRuntime {
  mode: PayMode;
  adapter: PayAdapter;
}

export const loadPayAdapterConfig = (env: NodeJS.ProcessEnv = process.env): PayAdapterConfig => {
  const mode = (env.PAY_MODE ?? "deterministic") as PayMode;
  const webhookSecret = env.PAY_WEBHOOK_SECRET;
  const callbackDedupeTtlMs = parseInteger(
    env.PAY_CALLBACK_DEDUPE_TTL_MS,
    DEFAULT_CALLBACK_DEDUPE_TTL_MS,
    "PAY_CALLBACK_DEDUPE_TTL_MS"
  );

  if (mode === "deterministic") {
    return {
      mode,
      webhookSecret,
      callbackDedupeTtlMs
    };
  }

  if (mode === "http") {
    const baseUrl = env.PAY_BASE_URL;
    if (!baseUrl) {
      throw new Error("PAY_BASE_URL is required when PAY_MODE=http.");
    }

    return {
      mode,
      baseUrl,
      timeoutMs: parseInteger(env.PAY_TIMEOUT_MS, DEFAULT_TIMEOUT_MS, "PAY_TIMEOUT_MS"),
      retry: {
        maxRetries: parseInteger(env.PAY_MAX_RETRIES, DEFAULT_MAX_RETRIES, "PAY_MAX_RETRIES"),
        baseDelayMs: parseInteger(env.PAY_RETRY_BASE_DELAY_MS, DEFAULT_RETRY_BASE_DELAY_MS, "PAY_RETRY_BASE_DELAY_MS"),
        jitterMs: 0
      },
      circuitBreaker: {
        failureThreshold: parseInteger(env.PAY_FAILURE_THRESHOLD, DEFAULT_FAILURE_THRESHOLD, "PAY_FAILURE_THRESHOLD"),
        cooldownMs: parseInteger(env.PAY_COOLDOWN_MS, DEFAULT_COOLDOWN_MS, "PAY_COOLDOWN_MS")
      },
      webhookSecret,
      callbackDedupeTtlMs
    };
  }

  throw new Error("PAY_MODE must be deterministic or http.");
};

export const createPayRuntime = (env: NodeJS.ProcessEnv = process.env): PayRuntime => {
  const config = loadPayAdapterConfig(env);
  return {
    mode: config.mode,
    adapter: createPayAdapter(config)
  };
};
