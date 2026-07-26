import { PolicyDecision, SettlementState } from "@ryvra/contracts";

import { runHappyPathPayment, type HappyPathInput } from "./happy-path-payment.js";

export const runDeniedPathPayment = async (input: HappyPathInput) => {
  const output = await runHappyPathPayment(input);
  if (output.result.decision.decision !== PolicyDecision.DENY) {
    throw new Error("Denied path expected a DENY policy decision.");
  }
  if (output.result.decision.reason_codes.length === 0) {
    throw new Error("Denied path expected machine-readable reason codes.");
  }
  if (output.result.settlement_state !== SettlementState.failed) {
    throw new Error("Denied path expected failed settlement state.");
  }
  return output;
};
