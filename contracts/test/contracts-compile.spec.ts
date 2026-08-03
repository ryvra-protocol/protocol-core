import test from "node:test";
import assert from "node:assert/strict";

import {
  ASSET_POSITION_FIELDS,
  CANONICAL_EVENT_ENVELOPE_FIELDS,
  CANONICAL_AMOUNT_FIELDS,
  CANONICAL_ID_FIELDS,
  CHAIN_ASSET_REF_FIELDS,
  CONTRACT_SCHEMA_VERSION,
  EXPOSURE_SNAPSHOT_FIELDS,
  OrderMarketState,
  PaymentIntentState,
  POLICY_REASON_CODES_VERSION,
  PR7_UNIFIED_ASSET_SCHEMA_VERSION,
  PolicyDecision,
  SettlementState,
  UNIFIED_ASSET_FIELDS,
  UNIFIED_BALANCE_FIELDS,
  validatePolicyDecisionOutput,
  validatePolicyReasonCodes,
  categorizePolicyReasonCode
} from "../src/index.js";

test("contracts compile and expose canonical vocabulary", () => {
  assert.equal(CONTRACT_SCHEMA_VERSION, "1.0.0");
  assert.equal(POLICY_REASON_CODES_VERSION, "1.0.0");
  assert.equal(PR7_UNIFIED_ASSET_SCHEMA_VERSION, "1.0.0-pr7");
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
  assert.deepEqual(CHAIN_ASSET_REF_FIELDS, ["chain_id", "contract_ref", "token_standard"]);
  assert.deepEqual(CANONICAL_AMOUNT_FIELDS, ["amount_minor", "amount_decimal", "decimals"]);
  assert.deepEqual(UNIFIED_ASSET_FIELDS, [
    "schema_version",
    "asset_id",
    "asset_type",
    "chain_asset_ref",
    "decimals",
    "settlement_class",
    "risk_flags",
    "metadata_ref"
  ]);
  assert.deepEqual(UNIFIED_BALANCE_FIELDS, ["account_id", "unified_asset", "quantity", "as_of"]);
  assert.deepEqual(ASSET_POSITION_FIELDS, ["account_id", "asset_id", "available", "locked", "pending_settlement", "as_of"]);
  assert.deepEqual(EXPOSURE_SNAPSHOT_FIELDS, [
    "schema_version",
    "account_id",
    "positions",
    "gross_exposure",
    "net_exposure",
    "captured_at"
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
