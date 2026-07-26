import { createDeterministicPayAdapter } from "./modes/deterministic.js";
import { createHttpPayAdapter } from "./modes/http.js";
import type { PayAdapter, PayAdapterConfig } from "./types.js";

export const createPayAdapter = (config: PayAdapterConfig): PayAdapter => {
  if (config.mode === "deterministic") {
    return createDeterministicPayAdapter(config);
  }
  return createHttpPayAdapter(config);
};

export * from "./types.js";
export * from "./client.js";
export * from "./mapper.js";
export * from "./validator.js";
export * from "./errors.js";
export * from "./retry.js";
export * from "./idempotency.js";
export * from "./webhooks.js";
export * from "./outbox.js";
export * from "./state-machine.js";
export * from "./modes/deterministic.js";
export * from "./modes/http.js";
