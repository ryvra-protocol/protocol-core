import {
  PolicyDecision,
  validatePolicyDecisionOutput,
  type PolicyDecisionInput,
  type PolicyDecisionOutput,
  asPolicyVersion
} from "@ryvra/contracts";

import type { SandboxContext } from "../context.js";
import { isAssetRestricted } from "./asset-registry.mock.js";

const ACTIVE_POLICY_VERSION = asPolicyVersion("policy-2026-01");
const MAX_ALLOWED_AMOUNT_MINOR = 1_000_000; // TBD by governance/policy
const MAX_ALLOWED_RISK_SCORE = 70; // TBD by governance/policy

export const evaluatePolicy = (
  context: SandboxContext,
  input: Omit<PolicyDecisionInput, "policy_version"> & { risk_score: number }
): PolicyDecisionOutput => {
  const reason_codes: string[] = [];

  if (input.amount_minor > MAX_ALLOWED_AMOUNT_MINOR) {
    reason_codes.push("LIMIT_EXCEEDED_AMOUNT_MINOR");
  }
  if (input.risk_score > MAX_ALLOWED_RISK_SCORE) {
    reason_codes.push("RISK_SCORE_HIGH_MODEL_V1");
  }
  if (isAssetRestricted(context, input.asset_id)) {
    reason_codes.push("ASSET_RESTRICTED_GLOBAL");
  }

  const decision = reason_codes.length > 0 ? PolicyDecision.DENY : PolicyDecision.ALLOW;

  const output: PolicyDecisionOutput = {
    decision,
    reason_codes: reason_codes as PolicyDecisionOutput["reason_codes"],
    policy_version: ACTIVE_POLICY_VERSION,
    evaluated_at: context.now()
  };

  if (!validatePolicyDecisionOutput(output)) {
    throw new Error("Policy decision output must include canonical reason codes and non-empty DENY reason_codes.");
  }

  context.decisionsByReference.set(input.reference_id, output);

  return output;
};
