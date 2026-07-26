import { asPolicyVersion, type PolicyDecisionOutput } from "@ryvra/contracts";

import type { PolicyDecisionEvaluateInput } from "./types.js";

export interface UpstreamPolicyRiskRequest {
  account_id: string;
  asset_id: string;
  amount_minor: number;
  reference_id: string;
  correlation_id: string;
  idempotency_key: string;
  policy_version: string;
  risk_score: number;
  jurisdiction?: string;
}

export interface UpstreamPolicyRiskResponse {
  decision: string;
  reason_codes?: string[];
  policy_version?: string;
  evaluated_at?: string;
  reasonCodes?: string[];
  policyVersion?: string;
  evaluatedAt?: string;
}

export const toUpstreamRequest = (input: PolicyDecisionEvaluateInput): UpstreamPolicyRiskRequest => ({
  account_id: input.account_id,
  asset_id: input.asset_id,
  amount_minor: input.amount_minor,
  reference_id: input.reference_id,
  correlation_id: input.correlation_id,
  idempotency_key: input.idempotency_key,
  policy_version: input.policy_version,
  risk_score: input.risk_score,
  jurisdiction: input.jurisdiction
});

export const toCanonicalDecisionOutput = (
  payload: UpstreamPolicyRiskResponse,
  fallback: { policyVersion: string; evaluatedAt: string }
): PolicyDecisionOutput => {
  const reasonCodes = payload.reason_codes ?? payload.reasonCodes ?? [];

  return {
    decision: payload.decision as PolicyDecisionOutput["decision"],
    reason_codes: reasonCodes as PolicyDecisionOutput["reason_codes"],
    policy_version: asPolicyVersion(payload.policy_version ?? payload.policyVersion ?? fallback.policyVersion),
    evaluated_at: payload.evaluated_at ?? payload.evaluatedAt ?? fallback.evaluatedAt
  };
};
