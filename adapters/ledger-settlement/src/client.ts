import { createDeterministicLedgerSettlementAdapter } from "./modes/deterministic.js";
import { createHttpLedgerSettlementAdapter } from "./modes/http.js";
import type { LedgerSettlementAdapter, LedgerSettlementAdapterConfig } from "./types.js";

export const createLedgerSettlementAdapter = (config: LedgerSettlementAdapterConfig): LedgerSettlementAdapter => {
  if (config.mode === "deterministic") {
    return createDeterministicLedgerSettlementAdapter(config);
  }
  return createHttpLedgerSettlementAdapter(config);
};
