import { createDeterministicPolicyRiskAdapter } from "./modes/deterministic.js";
import { createHttpPolicyRiskAdapter } from "./modes/http.js";
import type { PolicyRiskAdapter, PolicyRiskAdapterConfig } from "./types.js";

export const createPolicyRiskAdapter = (config: PolicyRiskAdapterConfig): PolicyRiskAdapter => {
  if (config.mode === "deterministic") {
    return createDeterministicPolicyRiskAdapter(config);
  }
  return createHttpPolicyRiskAdapter(config);
};
