import test from "node:test";
import assert from "node:assert/strict";

import {
  asAccountId,
  asAssetId,
  asCorrelationId,
  asIdempotencyKey,
  asPolicyVersion,
  asReferenceId
} from "@ryvra/contracts";

import { createDeterministicPolicyRiskAdapter } from "../src/modes/deterministic.js";

test("deterministic mode allows expected low-risk input", async () => {
  const adapter = createDeterministicPolicyRiskAdapter({
    mode: "deterministic",
    policyVersion: asPolicyVersion("policy-2026-01"),
    maxAllowedAmountMinor: 1_000_000,
    maxAllowedRiskScore: 70
  });

  const result = await adapter.evaluate(
    {
      account_id: asAccountId("acct_d1"),
      asset_id: asAssetId("asset_USDC"),
      amount_minor: 99,
      reference_id: asReferenceId("ref_d1"),
      policy_version: asPolicyVersion("policy-2026-01"),
      correlation_id: asCorrelationId("corr_d1"),
      idempotency_key: asIdempotencyKey("idem_d1"),
      risk_score: 15
    },
    {
      now: () => "2026-01-01T00:00:00.000Z",
      isAssetRestricted: () => false
    }
  );

  assert.equal(result.decision, "ALLOW");
  assert.deepEqual(result.reason_codes, []);
});

test("deterministic mode denies restricted/high-risk input", async () => {
  const adapter = createDeterministicPolicyRiskAdapter({
    mode: "deterministic",
    policyVersion: asPolicyVersion("policy-2026-01"),
    maxAllowedAmountMinor: 1_000_000,
    maxAllowedRiskScore: 70
  });

  const result = await adapter.evaluate(
    {
      account_id: asAccountId("acct_d2"),
      asset_id: asAssetId("asset_BLOCKED"),
      amount_minor: 2_000_000,
      reference_id: asReferenceId("ref_d2"),
      policy_version: asPolicyVersion("policy-2026-01"),
      correlation_id: asCorrelationId("corr_d2"),
      idempotency_key: asIdempotencyKey("idem_d2"),
      risk_score: 95
    },
    {
      now: () => "2026-01-01T00:00:01.000Z",
      isAssetRestricted: () => true
    }
  );

  assert.equal(result.decision, "DENY");
  assert.equal(result.reason_codes.length > 0, true);
});
