import { PolicyDecision, isPolicyReasonCode, validatePolicyDecisionOutput } from "@ryvra/contracts";

import { PolicyRiskValidationError } from "./errors.js";
import type { PolicyDecisionEvaluateInput } from "./types.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const assertPolicyDecisionInput = (input: PolicyDecisionEvaluateInput): void => {
  if (!input.account_id || !input.asset_id || !input.reference_id) {
    throw new PolicyRiskValidationError("Policy decision input missing identifiers.");
  }
  if (!input.idempotency_key || !input.correlation_id || !input.policy_version) {
    throw new PolicyRiskValidationError("Policy decision input missing idempotency/correlation/policy version metadata.");
  }
  if (!Number.isFinite(input.amount_minor) || input.amount_minor < 0) {
    throw new PolicyRiskValidationError("Policy decision input amount_minor must be a finite non-negative number.");
  }
  if (!Number.isFinite(input.risk_score) || input.risk_score < 0) {
    throw new PolicyRiskValidationError("Policy decision input risk_score must be a finite non-negative number.");
  }
};

export const assertUpstreamResponsePayload = (payload: unknown): Record<string, unknown> => {
  if (!isRecord(payload)) {
    throw new PolicyRiskValidationError("Upstream policy risk response must be an object.");
  }
  if (typeof payload.decision !== "string") {
    throw new PolicyRiskValidationError("Upstream policy risk response must include string decision field.");
  }
  return payload;
};

export const assertCanonicalDecisionOutput = (output: {
  decision: PolicyDecision;
  reason_codes: readonly string[];
}): void => {
  if (![PolicyDecision.ALLOW, PolicyDecision.DENY, PolicyDecision.REVIEW].includes(output.decision)) {
    throw new PolicyRiskValidationError("Decision must be ALLOW, DENY, or REVIEW.");
  }

  if (!Array.isArray(output.reason_codes)) {
    throw new PolicyRiskValidationError("reason_codes must be an array.");
  }

  if (output.reason_codes.some((code) => !isPolicyReasonCode(code))) {
    throw new PolicyRiskValidationError("reason_codes must follow canonical prefix taxonomy.");
  }

  if (!validatePolicyDecisionOutput(output)) {
    throw new PolicyRiskValidationError("Invalid policy decision output. DENY decisions must include non-empty canonical reason_codes.");
  }
};
