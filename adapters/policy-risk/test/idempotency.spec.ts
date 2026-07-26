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

test("deterministic mode deduplicates by reference_id + idempotency_key", async () => {
  const adapter = createDeterministicPolicyRiskAdapter({
    mode: "deterministic",
    policyVersion: asPolicyVersion("policy-2026-01"),
    maxAllowedAmountMinor: 1_000_000,
    maxAllowedRiskScore: 70
  });

  const common = {
    account_id: asAccountId("acct_1"),
    asset_id: asAssetId("asset_1"),
    amount_minor: 100,
    reference_id: asReferenceId("ref_1"),
    policy_version: asPolicyVersion("policy-2026-01"),
    correlation_id: asCorrelationId("corr_1"),
    idempotency_key: asIdempotencyKey("idem_1")
  };

  const first = await adapter.evaluate({ ...common, risk_score: 10 }, { now: () => "2026-01-01T00:00:00.000Z" });
  const replay = await adapter.evaluate({ ...common, risk_score: 99 }, { now: () => "2026-01-01T00:00:01.000Z" });

  assert.deepEqual(replay, first);
});
