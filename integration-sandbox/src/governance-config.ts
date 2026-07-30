import {
  DEFAULT_SANDBOX_GOVERNANCE_CONFIG,
  type PolicyRiskThresholdsConfig,
  type PotScoringConfig,
  type SandboxGovernanceConfig
} from "@ryvra/contracts";

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

const parseNonEmptyString = (raw: string | undefined, fallback: string): string => {
  if (!raw) {
    return fallback;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error("POT_SCORING_POLICY must be non-empty.");
  }

  return trimmed;
};

export const loadPolicyRiskThresholdsConfig = (
  env: NodeJS.ProcessEnv = process.env
): PolicyRiskThresholdsConfig => ({
  maxAllowedAmountMinor: parseInteger(
    env.POLICY_RISK_MAX_ALLOWED_AMOUNT_MINOR,
    DEFAULT_SANDBOX_GOVERNANCE_CONFIG.policyRisk.maxAllowedAmountMinor,
    "POLICY_RISK_MAX_ALLOWED_AMOUNT_MINOR"
  ),
  maxAllowedRiskScore: parseInteger(
    env.POLICY_RISK_MAX_ALLOWED_RISK_SCORE,
    DEFAULT_SANDBOX_GOVERNANCE_CONFIG.policyRisk.maxAllowedRiskScore,
    "POLICY_RISK_MAX_ALLOWED_RISK_SCORE"
  )
});

export const loadPotScoringConfig = (env: NodeJS.ProcessEnv = process.env): PotScoringConfig => ({
  contributionWeight: parseInteger(
    env.POT_CONTRIBUTION_WEIGHT,
    DEFAULT_SANDBOX_GOVERNANCE_CONFIG.pot.contributionWeight,
    "POT_CONTRIBUTION_WEIGHT"
  ),
  scoringPolicy: parseNonEmptyString(env.POT_SCORING_POLICY, DEFAULT_SANDBOX_GOVERNANCE_CONFIG.pot.scoringPolicy)
});

export const loadSandboxGovernanceConfig = (
  env: NodeJS.ProcessEnv = process.env
): SandboxGovernanceConfig => ({
  policyRisk: loadPolicyRiskThresholdsConfig(env),
  pot: loadPotScoringConfig(env)
});
