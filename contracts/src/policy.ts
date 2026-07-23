import type { AccountId, AssetId, PolicyVersion, ReferenceId } from "./ids.js";
import { PolicyDecision } from "./enums.js";

export const POLICY_REASON_CODE_PREFIXES = [
  "LIMIT_EXCEEDED_",
  "VELOCITY_EXCEEDED_",
  "JURISDICTION_RESTRICTED_",
  "SANCTIONS_HIT_",
  "RISK_SCORE_HIGH_",
  "DUPLICATE_REFERENCE_",
  "ASSET_RESTRICTED_"
] as const;

export type PolicyReasonCodePrefix = (typeof POLICY_REASON_CODE_PREFIXES)[number];

export type PolicyReasonCode =
  | `LIMIT_EXCEEDED_${string}`
  | `VELOCITY_EXCEEDED_${string}`
  | `JURISDICTION_RESTRICTED_${string}`
  | `SANCTIONS_HIT_${string}`
  | `RISK_SCORE_HIGH_${string}`
  | `DUPLICATE_REFERENCE_${string}`
  | `ASSET_RESTRICTED_${string}`;

export interface PolicyDecisionInput {
  account_id: AccountId;
  asset_id: AssetId;
  amount_minor: number;
  reference_id: ReferenceId;
  policy_version: PolicyVersion;
  jurisdiction?: string;
}

export interface PolicyDecisionOutput {
  decision: PolicyDecision;
  reason_codes: PolicyReasonCode[];
  policy_version: PolicyVersion;
  evaluated_at: string;
}

export const isPolicyReasonCode = (value: string): value is PolicyReasonCode =>
  POLICY_REASON_CODE_PREFIXES.some((prefix) => value.startsWith(prefix));

export const validatePolicyReasonCodes = (codes: readonly string[]): codes is PolicyReasonCode[] =>
  codes.length > 0 && codes.every((code) => isPolicyReasonCode(code));

export const validatePolicyDecisionOutput = (output: {
  decision: PolicyDecision;
  reason_codes: readonly string[];
}): output is { decision: PolicyDecision; reason_codes: PolicyReasonCode[] } => {
  if (!output.reason_codes.every((code) => isPolicyReasonCode(code))) {
    return false;
  }

  if (output.decision === PolicyDecision.DENY) {
    return output.reason_codes.length > 0;
  }

  return true;
};

export const categorizePolicyReasonCode = (code: PolicyReasonCode): PolicyReasonCodePrefix => {
  const prefix = POLICY_REASON_CODE_PREFIXES.find((candidate) => code.startsWith(candidate));
  if (!prefix) {
    throw new Error(`Unknown policy reason code: ${code}`);
  }

  return prefix;
};
