import {
  createLedgerSettlementAdapter,
  type LedgerSettlementAdapter,
  type LedgerSettlementAdapterConfig,
  type LedgerSettlementMode
} from "@ryvra/ledger-settlement-adapter";

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

export interface LedgerSettlementRuntime {
  mode: LedgerSettlementMode;
  adapter: LedgerSettlementAdapter;
}

export const loadLedgerSettlementAdapterConfig = (env: NodeJS.ProcessEnv = process.env): LedgerSettlementAdapterConfig => {
  const mode = (env.LEDGER_SETTLEMENT_MODE ?? "deterministic") as LedgerSettlementMode;

  if (mode === "deterministic") {
    return { mode };
  }

  if (mode === "http") {
    const baseUrl = env.LEDGER_SETTLEMENT_BASE_URL;
    if (!baseUrl) {
      throw new Error("LEDGER_SETTLEMENT_BASE_URL is required when LEDGER_SETTLEMENT_MODE=http.");
    }

    return {
      mode,
      baseUrl,
      timeoutMs: parseInteger(env.LEDGER_SETTLEMENT_TIMEOUT_MS, DEFAULT_TIMEOUT_MS, "LEDGER_SETTLEMENT_TIMEOUT_MS"),
      retry: {
        maxRetries: parseInteger(env.LEDGER_SETTLEMENT_MAX_RETRIES, DEFAULT_MAX_RETRIES, "LEDGER_SETTLEMENT_MAX_RETRIES"),
        baseDelayMs: parseInteger(
          env.LEDGER_SETTLEMENT_RETRY_BASE_DELAY_MS,
          DEFAULT_RETRY_BASE_DELAY_MS,
          "LEDGER_SETTLEMENT_RETRY_BASE_DELAY_MS"
        ),
        jitterMs: 0
      },
      circuitBreaker: {
        failureThreshold: parseInteger(
          env.LEDGER_SETTLEMENT_FAILURE_THRESHOLD,
          DEFAULT_FAILURE_THRESHOLD,
          "LEDGER_SETTLEMENT_FAILURE_THRESHOLD"
        ),
        cooldownMs: parseInteger(env.LEDGER_SETTLEMENT_COOLDOWN_MS, DEFAULT_COOLDOWN_MS, "LEDGER_SETTLEMENT_COOLDOWN_MS")
      }
    };
  }

  throw new Error("LEDGER_SETTLEMENT_MODE must be deterministic or http.");
};

export const createLedgerSettlementRuntime = (env: NodeJS.ProcessEnv = process.env): LedgerSettlementRuntime => {
  const config = loadLedgerSettlementAdapterConfig(env);
  return {
    mode: config.mode,
    adapter: createLedgerSettlementAdapter(config)
  };
};
