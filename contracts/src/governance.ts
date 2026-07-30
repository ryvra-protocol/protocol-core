export interface PolicyRiskThresholdsConfig {
  maxAllowedAmountMinor: number;
  maxAllowedRiskScore: number;
}

export interface PotScoringConfig {
  contributionWeight: number;
  scoringPolicy: string;
}

export interface SandboxGovernanceConfig {
  policyRisk: PolicyRiskThresholdsConfig;
  pot: PotScoringConfig;
}

export const DEFAULT_SANDBOX_GOVERNANCE_CONFIG: SandboxGovernanceConfig = {
  policyRisk: {
    maxAllowedAmountMinor: 1_000_000,
    maxAllowedRiskScore: 70
  },
  pot: {
    contributionWeight: 1,
    scoringPolicy: "pot-weight-v1-TBD-by-governance/policy"
  }
};
