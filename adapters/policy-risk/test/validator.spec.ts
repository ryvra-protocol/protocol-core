import test from "node:test";
import assert from "node:assert/strict";

import { PolicyDecision, asAccountId, asAssetId, asCorrelationId, asIdempotencyKey, asPolicyVersion, asReferenceId } from "@ryvra/contracts";

import { assertCanonicalDecisionOutput, assertPolicyDecisionInput } from "../src/validator.js";
import { PolicyRiskValidationError } from "../src/errors.js";

test("validator accepts valid canonical output", () => {
  assert.doesNotThrow(() => {
    assertCanonicalDecisionOutput({
      decision: PolicyDecision.DENY,
      reason_codes: ["LIMIT_EXCEEDED_AMOUNT_MINOR"]
    });
  });
});

test("validator rejects DENY with empty reason_codes", () => {
  assert.throws(
    () => {
      assertCanonicalDecisionOutput({ decision: PolicyDecision.DENY, reason_codes: [] });
    },
    (error) => error instanceof PolicyRiskValidationError
  );
});

test("validator rejects invalid reason code prefix", () => {
  assert.throws(
    () => {
      assertCanonicalDecisionOutput({ decision: PolicyDecision.DENY, reason_codes: ["BAD_PREFIX"] });
    },
    (error) => error instanceof PolicyRiskValidationError
  );
});

test("validator enforces evaluate input shape", () => {
  assert.doesNotThrow(() => {
    assertPolicyDecisionInput({
      account_id: asAccountId("acct_1"),
      asset_id: asAssetId("asset_1"),
      amount_minor: 1,
      reference_id: asReferenceId("ref_1"),
      policy_version: asPolicyVersion("policy-2026-01"),
      correlation_id: asCorrelationId("corr_1"),
      idempotency_key: asIdempotencyKey("idem_1"),
      risk_score: 10
    });
  });
});
