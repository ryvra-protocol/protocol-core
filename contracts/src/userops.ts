import type { Brand, CorrelationId, IdempotencyKey, ReferenceId } from "./ids.js";
import { UserOpFailureCategory, UserOpLifecycleStatus, UserOpSimulationStatus } from "./enums.js";
import { PR8_ERC4337_SCHEMA_VERSION } from "./version.js";

export type HexData = Brand<`0x${string}`, "hex_data">;
export type EvmAddress = Brand<`0x${string}`, "evm_address">;
export type UserOperationHash = Brand<`0x${string}`, "user_operation_hash">;

export interface SmartAccountRef {
  chain_id: number;
  account_address: EvmAddress;
  account_version?: string;
  implementation_ref?: string;
}

export interface EntryPointRef {
  chain_id: number;
  entry_point_address: EvmAddress;
  entry_point_version: string;
}

export interface BundlerRef {
  chain_id: number;
  bundler_id: string;
  endpoint_ref?: string;
}

export interface PaymasterRef {
  chain_id: number;
  paymaster_address: EvmAddress;
  paymaster_version?: string;
  sponsor_ref?: string;
}

export interface UserOperationCanonical {
  schema_version: typeof PR8_ERC4337_SCHEMA_VERSION;
  chain_id: number;
  entry_point: EntryPointRef;
  smart_account: SmartAccountRef;
  bundler?: BundlerRef;
  paymaster?: PaymasterRef;
  sender: EvmAddress;
  nonce: string;
  call_data_hex: HexData;
  call_gas_limit: string;
  verification_gas_limit: string;
  pre_verification_gas: string;
  max_fee_per_gas: string;
  max_priority_fee_per_gas: string;
  paymaster_data_hex?: HexData;
  signature_hex: HexData;
  user_operation_hash: UserOperationHash;
  reference_id: ReferenceId;
  idempotency_key: IdempotencyKey;
  correlation_id: CorrelationId;
  lifecycle_status: UserOpLifecycleStatus;
  submitted_at: string;
}

export interface UserOpSponsorshipPolicy {
  policy_id: string;
  chain_id: number;
  paymaster: PaymasterRef;
  sponsorship_mode: "none" | "full" | "partial";
  max_sponsored_fee_per_gas?: string;
  max_sponsored_total_cost_minor?: string;
  allowed_accounts?: SmartAccountRef[];
  denied_accounts?: SmartAccountRef[];
  valid_from?: string;
  valid_until?: string;
}

export interface UserOpSimulationResult {
  chain_id: number;
  entry_point: EntryPointRef;
  user_operation_hash: UserOperationHash;
  simulation_status: UserOpSimulationStatus;
  lifecycle_status: UserOpLifecycleStatus;
  failure_category?: UserOpFailureCategory;
  failure_reason?: string;
  revert_data_hex?: HexData;
  estimated_call_gas_limit?: string;
  estimated_pre_verification_gas?: string;
  estimated_verification_gas_limit?: string;
  simulated_at: string;
}

export interface UserOpReplayBoundary {
  chain_id: number;
  sender: EvmAddress;
  nonce: string;
  user_operation_hash: UserOperationHash;
  idempotency_key: IdempotencyKey;
  replay_window_ref?: string;
  duplicate_detected: boolean;
}

export const SMART_ACCOUNT_REF_FIELDS = ["chain_id", "account_address", "account_version", "implementation_ref"] as const;
export const ENTRY_POINT_REF_FIELDS = ["chain_id", "entry_point_address", "entry_point_version"] as const;
export const BUNDLER_REF_FIELDS = ["chain_id", "bundler_id", "endpoint_ref"] as const;
export const PAYMASTER_REF_FIELDS = ["chain_id", "paymaster_address", "paymaster_version", "sponsor_ref"] as const;

export const CANONICAL_USER_OPERATION_FIELDS = [
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
] as const;

export const USEROP_SPONSORSHIP_POLICY_FIELDS = [
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
] as const;

export const USEROP_SIMULATION_RESULT_FIELDS = [
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
] as const;

export const USEROP_REPLAY_BOUNDARY_FIELDS = [
  "chain_id",
  "sender",
  "nonce",
  "user_operation_hash",
  "idempotency_key",
  "replay_window_ref",
  "duplicate_detected"
] as const;

export const USEROP_EVENT_SUBMITTED = "userop.submitted" as const;
export const USEROP_EVENT_SIMULATED = "userop.simulated" as const;
export const USEROP_EVENT_INCLUDED = "userop.included" as const;
export const USEROP_EVENT_FAILED = "userop.failed" as const;
export const USEROP_EVENT_FINALIZED = "userop.finalized" as const;

export const USEROP_EVENT_TYPES = [
  USEROP_EVENT_SUBMITTED,
  USEROP_EVENT_SIMULATED,
  USEROP_EVENT_INCLUDED,
  USEROP_EVENT_FAILED,
  USEROP_EVENT_FINALIZED
] as const;

export interface UserOpSubmittedEvent {
  event_type: typeof USEROP_EVENT_SUBMITTED;
  lifecycle_status: UserOpLifecycleStatus.submitted;
  user_operation: UserOperationCanonical;
  received_at: string;
}

export interface UserOpSimulatedEvent {
  event_type: typeof USEROP_EVENT_SIMULATED;
  lifecycle_status: UserOpLifecycleStatus.simulated;
  user_operation_hash: UserOperationHash;
  simulation_result: UserOpSimulationResult;
}

export interface UserOpIncludedEvent {
  event_type: typeof USEROP_EVENT_INCLUDED;
  lifecycle_status: UserOpLifecycleStatus.included;
  user_operation_hash: UserOperationHash;
  chain_id: number;
  transaction_hash: HexData;
  block_number: number;
  included_at: string;
}

export interface UserOpFailedEvent {
  event_type: typeof USEROP_EVENT_FAILED;
  lifecycle_status: UserOpLifecycleStatus.failed;
  user_operation_hash: UserOperationHash;
  chain_id: number;
  failure_category: UserOpFailureCategory;
  failure_reason: string;
  failed_at: string;
}

export interface UserOpFinalizedEvent {
  event_type: typeof USEROP_EVENT_FINALIZED;
  lifecycle_status: UserOpLifecycleStatus.finalized;
  user_operation_hash: UserOperationHash;
  chain_id: number;
  transaction_hash: HexData;
  block_number: number;
  finality_confirmations: number;
  finalized_at: string;
}

export const USEROP_SUBMITTED_EVENT_FIELDS = ["event_type", "lifecycle_status", "user_operation", "received_at"] as const;
export const USEROP_SIMULATED_EVENT_FIELDS = [
  "event_type",
  "lifecycle_status",
  "user_operation_hash",
  "simulation_result"
] as const;
export const USEROP_INCLUDED_EVENT_FIELDS = [
  "event_type",
  "lifecycle_status",
  "user_operation_hash",
  "chain_id",
  "transaction_hash",
  "block_number",
  "included_at"
] as const;
export const USEROP_FAILED_EVENT_FIELDS = [
  "event_type",
  "lifecycle_status",
  "user_operation_hash",
  "chain_id",
  "failure_category",
  "failure_reason",
  "failed_at"
] as const;
export const USEROP_FINALIZED_EVENT_FIELDS = [
  "event_type",
  "lifecycle_status",
  "user_operation_hash",
  "chain_id",
  "transaction_hash",
  "block_number",
  "finality_confirmations",
  "finalized_at"
] as const;
