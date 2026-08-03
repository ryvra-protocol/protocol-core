import test from "node:test";
import assert from "node:assert/strict";

import {
  ASSET_POSITION_FIELDS,
  BUNDLER_REF_FIELDS,
  CANONICAL_EVENT_ENVELOPE_FIELDS,
  CANONICAL_AMOUNT_FIELDS,
  CANONICAL_ID_FIELDS,
  ENTRY_POINT_REF_FIELDS,
  CHAIN_ASSET_REF_FIELDS,
  CONTRACT_SCHEMA_VERSION,
  EXPOSURE_SNAPSHOT_FIELDS,
  OrderMarketState,
  PAYMASTER_REF_FIELDS,
  PaymentIntentState,
  PR8_ERC4337_SCHEMA_VERSION,
  POLICY_REASON_CODES_VERSION,
  PR7_UNIFIED_ASSET_SCHEMA_VERSION,
  PolicyDecision,
  SMART_ACCOUNT_REF_FIELDS,
  SPONSORSHIP_POLICY_DECISION_FIELDS,
  SPONSORSHIP_POLICY_INPUT_FIELDS,
  SettlementState,
  UNIFIED_ASSET_FIELDS,
  UNIFIED_BALANCE_FIELDS,
  USER_OPERATION_CANONICAL_FIELDS,
  USER_OPERATION_EVENT_TYPES,
  USER_OPERATION_FAILED_PAYLOAD_FIELDS,
  USER_OPERATION_FINALIZED_PAYLOAD_FIELDS,
  USER_OPERATION_INCLUDED_PAYLOAD_FIELDS,
  UserOperationLifecycleStatus,
  USER_OPERATION_REPLAY_RECORD_FIELDS,
  USER_OPERATION_SIMULATED_PAYLOAD_FIELDS,
  USER_OPERATION_SIMULATION_RESULT_FIELDS,
  USER_OPERATION_SUBMITTED_PAYLOAD_FIELDS,
  UserOperationSimulationOutcome,
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
  assert.deepEqual(SMART_ACCOUNT_REF_FIELDS, [
    "chain_id",
    "account_address",
    "factory_address",
    "implementation_ref",
    "account_version"
  ]);
  assert.deepEqual(ENTRY_POINT_REF_FIELDS, ["chain_id", "entry_point_address", "entry_point_version"]);
  assert.deepEqual(BUNDLER_REF_FIELDS, ["chain_id", "bundler_id", "endpoint", "software_version"]);
  assert.deepEqual(PAYMASTER_REF_FIELDS, ["chain_id", "paymaster_address", "paymaster_service_id", "sponsorship_mode"]);
  assert.deepEqual(USER_OPERATION_CANONICAL_FIELDS, [
    "chain_id",
    "entry_point",
    "user_op_hash",
    "sender",
    "nonce",
    "init_code_hash",
    "call_data_hash",
    "call_gas_limit",
    "verification_gas_limit",
    "pre_verification_gas",
    "max_fee_per_gas",
    "max_priority_fee_per_gas",
    "paymaster_and_data_hash",
    "signature_hash",
    "idempotency_key",
    "reference_id",
    "correlation_id",
    "policy_version",
    "submitted_at"
  ]);
  assert.deepEqual(SPONSORSHIP_POLICY_INPUT_FIELDS, [
    "user_operation",
    "smart_account",
    "paymaster",
    "sponsor_budget_minor",
    "max_fee_per_gas"
  ]);
  assert.deepEqual(SPONSORSHIP_POLICY_DECISION_FIELDS, [
    "decision",
    "sponsor_ref",
    "reason_codes",
    "policy_version",
    "evaluated_at"
  ]);
  assert.deepEqual(USER_OPERATION_SIMULATION_RESULT_FIELDS, [
    "user_op_hash",
    "chain_id",
    "entry_point",
    "outcome",
    "status",
    "estimated_pre_verification_gas",
    "estimated_verification_gas",
    "estimated_call_gas",
    "failure_reason_code",
    "revert_data",
    "simulated_at"
  ]);
  assert.deepEqual(USER_OPERATION_REPLAY_RECORD_FIELDS, [
    "chain_id",
    "entry_point_address",
    "sender",
    "nonce",
    "user_op_hash",
    "idempotency_key",
    "dedupe_scope",
    "first_seen_at",
    "expires_at"
  ]);
  assert.deepEqual(USER_OPERATION_EVENT_TYPES, [
    "userop.submitted",
    "userop.simulated",
    "userop.included",
    "userop.failed",
    "userop.finalized"
  ]);
  assert.deepEqual(USER_OPERATION_SUBMITTED_PAYLOAD_FIELDS, [
    "status",
    "user_op_hash",
    "user_operation",
    "smart_account",
    "bundler"
  ]);
  assert.deepEqual(USER_OPERATION_SIMULATED_PAYLOAD_FIELDS, ["status", "user_op_hash", "simulation"]);
  assert.deepEqual(USER_OPERATION_INCLUDED_PAYLOAD_FIELDS, [
    "status",
    "user_op_hash",
    "entry_point",
    "transaction_hash",
    "block_number",
    "block_hash",
    "included_at"
  ]);
  assert.deepEqual(USER_OPERATION_FAILED_PAYLOAD_FIELDS, [
    "status",
    "user_op_hash",
    "stage",
    "reason_code",
    "retryable",
    "failed_at"
  ]);
  assert.deepEqual(USER_OPERATION_FINALIZED_PAYLOAD_FIELDS, [
    "status",
    "user_op_hash",
    "transaction_hash",
    "finalized_block_number",
    "confirmations",
    "finalized_at"
  ]);
  assert.equal(PolicyDecision.ALLOW, "ALLOW");
  assert.deepEqual(Object.values(UserOperationLifecycleStatus), [
    "submitted",
    "simulated",
    "included",
    "failed",
    "finalized",
    "dropped"
  ]);
  assert.deepEqual(Object.values(UserOperationSimulationOutcome), [
    "success",
    "validation_reverted",
    "execution_reverted",
    "paymaster_rejected",
    "aggregator_rejected",
    "malformed",
    "throttled",
    "internal_error"
  ]);
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
