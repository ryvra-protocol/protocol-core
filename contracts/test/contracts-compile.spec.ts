import test from "node:test";
import assert from "node:assert/strict";

import {
  CANONICAL_EVENT_ENVELOPE_FIELDS,
  CANONICAL_ID_FIELDS,
  CONTRACT_SCHEMA_VERSION,
  OrderMarketState,
  PaymentIntentState,
  POLICY_REASON_CODES_VERSION,
  PolicyDecision,
  SettlementState,
  validatePolicyDecisionOutput,
  validatePolicyReasonCodes,
  categorizePolicyReasonCode
} from "../src/index.js";

test("contracts compile and expose canonical vocabulary", () => {
  assert.equal(CONTRACT_SCHEMA_VERSION, "1.0.0");
  assert.equal(POLICY_REASON_CODES_VERSION, "1.0.0");
  assert.deepEqual(CANONICAL_ID_FIELDS, [
    "account_id",
    "asset_id",
    "ledger_event_id",
    "posting_id",
    "reference_id",
    "idempotency_key",
    "policy_version",
    "correlation_id"
  ]);
  assert.deepEqual(CANONICAL_EVENT_ENVELOPE_FIELDS, [
    "event_id",
    "correlation_id",
    "reference_id",
    "event_type",
    "timestamp",
    "payload"
  ]);
  assert.equal(PolicyDecision.ALLOW, "ALLOW");
  assert.deepEqual(Object.values(PaymentIntentState), [
    "created",
    "authorized",
    "executing",
    "settled",
    "failed",
    "reversed"
  ]);
  assert.deepEqual(Object.values(SettlementState), ["accepted", "executed", "finalized", "reconciled", "failed"]);
  assert.deepEqual(Object.values(OrderMarketState), [
    "created",
    "validated",
    "routed",
    "partially_filled",
    "filled",
    "canceled",
    "expired",
    "failed",
    "settled"
  ]);
  assert.equal(SettlementState.reconciled, "reconciled");
  assert.equal(validatePolicyReasonCodes(["DUPLICATE_REFERENCE_REPLAY"]), true);
  assert.equal(categorizePolicyReasonCode("DUPLICATE_REFERENCE_REPLAY"), "DUPLICATE_REFERENCE_");
  assert.equal(
    validatePolicyDecisionOutput({
      decision: PolicyDecision.DENY,
      reason_codes: ["LIMIT_EXCEEDED_AMOUNT_MINOR"]
    }),
    true
  );
  assert.equal(
    validatePolicyDecisionOutput({
      decision: PolicyDecision.DENY,
      reason_codes: []
    }),
    false
  );
});
