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

import { toCanonicalDecisionOutput, toUpstreamRequest } from "../src/mapper.js";

test("mapper translates canonical input to upstream payload", () => {
  const mapped = toUpstreamRequest({
    account_id: asAccountId("acct_1"),
    asset_id: asAssetId("asset_1"),
    amount_minor: 22,
    reference_id: asReferenceId("ref_1"),
    correlation_id: asCorrelationId("corr_1"),
    idempotency_key: asIdempotencyKey("idem_1"),
    policy_version: asPolicyVersion("policy-2026-01"),
    risk_score: 30,
    jurisdiction: "US"
  });

  assert.deepEqual(mapped, {
    account_id: "acct_1",
    asset_id: "asset_1",
    amount_minor: 22,
    reference_id: "ref_1",
    correlation_id: "corr_1",
    idempotency_key: "idem_1",
    policy_version: "policy-2026-01",
    risk_score: 30,
    jurisdiction: "US"
  });
});

test("mapper translates upstream payload to canonical output", () => {
  const mapped = toCanonicalDecisionOutput(
    {
      decision: "DENY",
      reasonCodes: ["RISK_SCORE_HIGH_MODEL_V1"],
      policyVersion: "policy-2026-01",
      evaluatedAt: "2026-01-01T00:00:00.000Z",
      extra: "drop"
    } as never,
    {
      policyVersion: "policy-fallback",
      evaluatedAt: "2026-01-02T00:00:00.000Z"
    }
  );

  assert.deepEqual(mapped, {
    decision: "DENY",
    reason_codes: ["RISK_SCORE_HIGH_MODEL_V1"],
    policy_version: "policy-2026-01",
    evaluated_at: "2026-01-01T00:00:00.000Z"
  });
});
