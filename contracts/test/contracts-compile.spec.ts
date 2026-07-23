import test from "node:test";
import assert from "node:assert/strict";

import {
  CONTRACT_SCHEMA_VERSION,
  POLICY_REASON_CODES_VERSION,
  PolicyDecision,
  SettlementState,
  validatePolicyReasonCodes,
  categorizePolicyReasonCode
} from "../src/index.js";

test("contracts compile and expose canonical vocabulary", () => {
  assert.equal(CONTRACT_SCHEMA_VERSION, "1.0.0");
  assert.equal(POLICY_REASON_CODES_VERSION, "1.0.0");
  assert.equal(PolicyDecision.ALLOW, "ALLOW");
  assert.equal(SettlementState.reconciled, "reconciled");
  assert.equal(validatePolicyReasonCodes(["DUPLICATE_REFERENCE_REPLAY"]), true);
  assert.equal(categorizePolicyReasonCode("DUPLICATE_REFERENCE_REPLAY"), "DUPLICATE_REFERENCE_");
});
