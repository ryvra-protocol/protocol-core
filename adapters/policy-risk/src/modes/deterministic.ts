import { PolicyDecision, type PolicyDecisionOutput } from "@ryvra/contracts";

import { InMemoryIdempotencyCache, policyReplayKey } from "../idempotency.js";
import { assertCanonicalDecisionOutput, assertPolicyDecisionInput } from "../validator.js";
import type { DeterministicPolicyRiskAdapterConfig, PolicyRiskAdapter } from "../types.js";

export const createDeterministicPolicyRiskAdapter = (config: DeterministicPolicyRiskAdapterConfig): PolicyRiskAdapter => {
  const idempotencyCache = new InMemoryIdempotencyCache();

  return {
    async evaluate(input, context) {
      assertPolicyDecisionInput(input);
      const replayKey = policyReplayKey(input.reference_id, input.idempotency_key);

      return idempotencyCache.dedupe(replayKey, async () => {
        const reason_codes: string[] = [];

        if (input.amount_minor > config.maxAllowedAmountMinor) {
          reason_codes.push("LIMIT_EXCEEDED_AMOUNT_MINOR");
        }
        if (input.risk_score > config.maxAllowedRiskScore) {
          reason_codes.push("RISK_SCORE_HIGH_MODEL_V1");
        }
        if (context?.isAssetRestricted?.(input.asset_id)) {
          reason_codes.push("ASSET_RESTRICTED_GLOBAL");
        }

        const output: PolicyDecisionOutput = {
          decision: reason_codes.length > 0 ? PolicyDecision.DENY : PolicyDecision.ALLOW,
          reason_codes: reason_codes as PolicyDecisionOutput["reason_codes"],
          policy_version: input.policy_version ?? config.policyVersion,
          evaluated_at: context?.now?.() ?? new Date(0).toISOString()
        };

        assertCanonicalDecisionOutput(output);
        return output;
      });
    }
  };
};
