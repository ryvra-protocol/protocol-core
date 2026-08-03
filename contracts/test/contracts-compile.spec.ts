import test from "node:test";
import assert from "node:assert/strict";

import {
  ASSET_POSITION_FIELDS,
  BUNDLER_REF_FIELDS,
  CANONICAL_USER_OPERATION_FIELDS,
  CANONICAL_EVENT_ENVELOPE_FIELDS,
  CANONICAL_AMOUNT_FIELDS,
  CANONICAL_ID_FIELDS,
  CHAIN_ASSET_REF_FIELDS,
  CONTRACT_SCHEMA_VERSION,
  ENTRY_POINT_REF_FIELDS,
  EXPOSURE_SNAPSHOT_FIELDS,
  OrderMarketState,
  PaymentIntentState,
  POLICY_REASON_CODES_VERSION,
  PR8_ERC4337_SCHEMA_VERSION,
  PR7_UNIFIED_ASSET_SCHEMA_VERSION,
  PolicyDecision,
  SettlementState,
  SMART_ACCOUNT_REF_FIELDS,
  UserOpFailureCategory,
  UserOpLifecycleStatus,
  UserOpSimulationStatus,
  UNIFIED_ASSET_FIELDS,
  UNIFIED_BALANCE_FIELDS,
  USEROP_EVENT_FAILED,
  USEROP_EVENT_FINALIZED,
  USEROP_EVENT_INCLUDED,
  USEROP_EVENT_SIMULATED,
  USEROP_EVENT_SUBMITTED,
  USEROP_EVENT_TYPES,
  USEROP_FAILED_EVENT_FIELDS,
  USEROP_FINALIZED_EVENT_FIELDS,
  USEROP_INCLUDED_EVENT_FIELDS,
  USEROP_REPLAY_BOUNDARY_FIELDS,
  USEROP_SIMULATED_EVENT_FIELDS,
  USEROP_SIMULATION_RESULT_FIELDS,
  USEROP_SPONSORSHIP_POLICY_FIELDS,
  USEROP_SUBMITTED_EVENT_FIELDS,
  PAYMASTER_REF_FIELDS,
  validatePolicyDecisionOutput,
  validatePolicyReasonCodes,
  categorizePolicyReasonCode
} from "../src/index.js";

test("contracts compile and expose canonical vocabulary", () => {
  assert.equal(CONTRACT_SCHEMA_VERSION, "1.0.0");
  assert.equal(POLICY_REASON_CODES_VERSION, "1.0.0");
  assert.equal(PR7_UNIFIED_ASSET_SCHEMA_VERSION, "1.0.0-pr7");
  assert.equal(PR8_ERC4337_SCHEMA_VERSION, "1.0.0-pr8");
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
  assert.deepEqual(SMART_ACCOUNT_REF_FIELDS, ["chain_id", "account_address", "account_version", "implementation_ref"]);
  assert.deepEqual(ENTRY_POINT_REF_FIELDS, ["chain_id", "entry_point_address", "entry_point_version"]);
  assert.deepEqual(BUNDLER_REF_FIELDS, ["chain_id", "bundler_id", "endpoint_ref"]);
  assert.deepEqual(PAYMASTER_REF_FIELDS, ["chain_id", "paymaster_address", "paymaster_version", "sponsor_ref"]);
  assert.deepEqual(CANONICAL_USER_OPERATION_FIELDS, [
    "schema_version",
    "chain_id",
    "entry_point",
    "smart_account",
    "bundler",
    "paymaster",
    "sender",
    "nonce",
    "call_data_hex",
    "call_gas_limit",
    "verification_gas_limit",
    "pre_verification_gas",
    "max_fee_per_gas",
    "max_priority_fee_per_gas",
    "paymaster_data_hex",
    "signature_hex",
    "user_operation_hash",
    "reference_id",
    "idempotency_key",
    "correlation_id",
    "lifecycle_status",
    "submitted_at"
  ]);
  assert.deepEqual(USEROP_SPONSORSHIP_POLICY_FIELDS, [
    "policy_id",
    "chain_id",
    "paymaster",
    "sponsorship_mode",
    "max_sponsored_fee_per_gas",
    "max_sponsored_total_cost_minor",
    "allowed_accounts",
    "denied_accounts",
    "valid_from",
    "valid_until"
  ]);
  assert.deepEqual(USEROP_SIMULATION_RESULT_FIELDS, [
    "chain_id",
    "entry_point",
    "user_operation_hash",
    "simulation_status",
    "lifecycle_status",
    "failure_category",
    "failure_reason",
    "revert_data_hex",
    "estimated_call_gas_limit",
    "estimated_pre_verification_gas",
    "estimated_verification_gas_limit",
    "simulated_at"
  ]);
  assert.deepEqual(USEROP_REPLAY_BOUNDARY_FIELDS, [
    "chain_id",
    "sender",
    "nonce",
    "user_operation_hash",
    "idempotency_key",
    "replay_window_ref",
    "duplicate_detected"
  ]);
  assert.deepEqual(USEROP_EVENT_TYPES, [
    USEROP_EVENT_SUBMITTED,
    USEROP_EVENT_SIMULATED,
    USEROP_EVENT_INCLUDED,
    USEROP_EVENT_FAILED,
    USEROP_EVENT_FINALIZED
  ]);
  assert.deepEqual(USEROP_SUBMITTED_EVENT_FIELDS, ["event_type", "lifecycle_status", "user_operation", "received_at"]);
  assert.deepEqual(USEROP_SIMULATED_EVENT_FIELDS, [
    "event_type",
    "lifecycle_status",
    "user_operation_hash",
    "simulation_result"
  ]);
  assert.deepEqual(USEROP_INCLUDED_EVENT_FIELDS, [
    "event_type",
    "lifecycle_status",
    "user_operation_hash",
    "chain_id",
    "transaction_hash",
    "block_number",
    "included_at"
  ]);
  assert.deepEqual(USEROP_FAILED_EVENT_FIELDS, [
    "event_type",
    "lifecycle_status",
    "user_operation_hash",
    "chain_id",
    "failure_category",
    "failure_reason",
    "failed_at"
  ]);
  assert.deepEqual(USEROP_FINALIZED_EVENT_FIELDS, [
    "event_type",
    "lifecycle_status",
    "user_operation_hash",
    "chain_id",
    "transaction_hash",
    "block_number",
    "finality_confirmations",
    "finalized_at"
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
  assert.deepEqual(Object.values(UserOpLifecycleStatus), ["submitted", "simulated", "included", "failed", "finalized"]);
  assert.deepEqual(Object.values(UserOpSimulationStatus), ["success", "failure"]);
  assert.deepEqual(Object.values(UserOpFailureCategory), [
    "validation",
    "execution",
    "paymaster",
    "bundler",
    "inclusion_timeout",
    "reorg",
    "unknown"
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
