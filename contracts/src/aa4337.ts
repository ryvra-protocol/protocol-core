import type { CorrelationId, IdempotencyKey, PolicyVersion, ReferenceId, Brand } from "./ids.js";

export type HexString = `0x${string}`;
export type EvmAddress = Brand<HexString, "evm_address">;
export type UserOpHash = Brand<HexString, "user_op_hash">;

export const asEvmAddress = (value: HexString): EvmAddress => value as EvmAddress;
export const asUserOpHash = (value: HexString): UserOpHash => value as UserOpHash;

export interface SmartAccountRef {
  chain_id: number;
  account_address: EvmAddress;
  factory_address?: EvmAddress;
  implementation_ref?: string;
  account_version?: string;
}

export interface EntryPointRef {
  chain_id: number;
  entry_point_address: EvmAddress;
  entry_point_version: "v0.6" | "v0.7" | (string & {});
}

export interface BundlerRef {
  chain_id: number;
  bundler_id: string;
  endpoint: string;
  software_version?: string;
}

export interface PaymasterRef {
  chain_id: number;
  paymaster_address?: EvmAddress;
  paymaster_service_id?: string;
  sponsorship_mode: "none" | "full" | "partial" | "post_op";
}

export enum UserOperationLifecycleStatus {
  submitted = "submitted",
  simulated = "simulated",
  included = "included",
  failed = "failed",
  finalized = "finalized",
  dropped = "dropped"
}

export interface CanonicalUserOperation {
  chain_id: number;
  entry_point: EntryPointRef;
  user_op_hash: UserOpHash;
  sender: EvmAddress;
  nonce: string;
  init_code_hash?: HexString;
  call_data_hash: HexString;
  call_gas_limit: string;
  verification_gas_limit: string;
  pre_verification_gas: string;
  max_fee_per_gas: string;
  max_priority_fee_per_gas: string;
  paymaster_and_data_hash?: HexString;
  signature_hash: HexString;
  idempotency_key: IdempotencyKey;
  reference_id: ReferenceId;
  correlation_id: CorrelationId;
  policy_version?: PolicyVersion;
  submitted_at: string;
}

export interface SponsorshipPolicyInput {
  user_operation: CanonicalUserOperation;
  smart_account: SmartAccountRef;
  paymaster?: PaymasterRef;
  sponsor_budget_minor?: string;
  max_fee_per_gas: string;
}

export interface SponsorshipPolicyDecision {
  decision: "sponsored" | "partial" | "rejected";
  sponsor_ref?: PaymasterRef;
  reason_codes: string[];
  policy_version: PolicyVersion;
  evaluated_at: string;
}

export enum UserOperationSimulationOutcome {
  success = "success",
  validation_reverted = "validation_reverted",
  execution_reverted = "execution_reverted",
  paymaster_rejected = "paymaster_rejected",
  aggregator_rejected = "aggregator_rejected",
  malformed = "malformed",
  throttled = "throttled",
  internal_error = "internal_error"
}

export interface UserOperationSimulationResult {
  user_op_hash: UserOpHash;
  chain_id: number;
  entry_point: EntryPointRef;
  outcome: UserOperationSimulationOutcome;
  status: "success" | "failure";
  estimated_pre_verification_gas?: string;
  estimated_verification_gas?: string;
  estimated_call_gas?: string;
  failure_reason_code?: string;
  revert_data?: HexString;
  simulated_at: string;
}

export interface UserOperationReplayRecord {
  chain_id: number;
  entry_point_address: EvmAddress;
  sender: EvmAddress;
  nonce: string;
  user_op_hash: UserOpHash;
  idempotency_key: IdempotencyKey;
  dedupe_scope: "chain_entrypoint_sender_nonce" | "user_op_hash" | "idempotency_key";
  first_seen_at: string;
  expires_at?: string;
}

export const SMART_ACCOUNT_REF_FIELDS = [
  "chain_id",
  "account_address",
  "factory_address",
  "implementation_ref",
  "account_version"
] as const;

export const ENTRY_POINT_REF_FIELDS = ["chain_id", "entry_point_address", "entry_point_version"] as const;

export const BUNDLER_REF_FIELDS = ["chain_id", "bundler_id", "endpoint", "software_version"] as const;

export const PAYMASTER_REF_FIELDS = ["chain_id", "paymaster_address", "paymaster_service_id", "sponsorship_mode"] as const;

export const USER_OPERATION_CANONICAL_FIELDS = [
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
] as const;

export const SPONSORSHIP_POLICY_INPUT_FIELDS = [
  "user_operation",
  "smart_account",
  "paymaster",
  "sponsor_budget_minor",
  "max_fee_per_gas"
] as const;

export const SPONSORSHIP_POLICY_DECISION_FIELDS = [
  "decision",
  "sponsor_ref",
  "reason_codes",
  "policy_version",
  "evaluated_at"
] as const;

export const USER_OPERATION_SIMULATION_RESULT_FIELDS = [
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
] as const;

export const USER_OPERATION_REPLAY_RECORD_FIELDS = [
  "chain_id",
  "entry_point_address",
  "sender",
  "nonce",
  "user_op_hash",
  "idempotency_key",
  "dedupe_scope",
  "first_seen_at",
  "expires_at"
] as const;
