import type { CorrelationId, ReferenceId } from "./ids.js";
import type {
  BundlerRef,
  CanonicalUserOperation,
  EntryPointRef,
  SmartAccountRef,
  UserOpHash,
  UserOperationLifecycleStatus,
  UserOperationSimulationResult
} from "./aa4337.js";
import type { EventEnvelope } from "./events.js";

export const USER_OPERATION_EVENT_TYPES = [
  "userop.submitted",
  "userop.simulated",
  "userop.included",
  "userop.failed",
  "userop.finalized"
] as const;

export type UserOperationEventType = (typeof USER_OPERATION_EVENT_TYPES)[number];

export interface UserOperationSubmittedPayload {
  status: UserOperationLifecycleStatus.submitted;
  user_op_hash: UserOpHash;
  user_operation: CanonicalUserOperation;
  smart_account: SmartAccountRef;
  bundler?: BundlerRef;
}

export interface UserOperationSimulatedPayload {
  status: UserOperationLifecycleStatus.simulated | UserOperationLifecycleStatus.failed;
  user_op_hash: UserOpHash;
  simulation: UserOperationSimulationResult;
}

export interface UserOperationIncludedPayload {
  status: UserOperationLifecycleStatus.included;
  user_op_hash: UserOpHash;
  entry_point: EntryPointRef;
  transaction_hash: string;
  block_number: number;
  block_hash: string;
  included_at: string;
}

export interface UserOperationFailedPayload {
  status: UserOperationLifecycleStatus.failed | UserOperationLifecycleStatus.dropped;
  user_op_hash: UserOpHash;
  stage: "validation" | "simulation" | "inclusion" | "execution";
  reason_code: string;
  retryable: boolean;
  failed_at: string;
}

export interface UserOperationFinalizedPayload {
  status: UserOperationLifecycleStatus.finalized;
  user_op_hash: UserOpHash;
  transaction_hash: string;
  finalized_block_number: number;
  confirmations: number;
  finalized_at: string;
}

export interface CanonicalUserOperationEventEnvelope<
  TType extends UserOperationEventType,
  TPayload
> extends EventEnvelope<TPayload> {
  event_type: TType;
  reference_id: ReferenceId;
  correlation_id: CorrelationId;
}

export type UserOperationSubmittedEvent = CanonicalUserOperationEventEnvelope<
  "userop.submitted",
  UserOperationSubmittedPayload
>;

export type UserOperationSimulatedEvent = CanonicalUserOperationEventEnvelope<
  "userop.simulated",
  UserOperationSimulatedPayload
>;

export type UserOperationIncludedEvent = CanonicalUserOperationEventEnvelope<"userop.included", UserOperationIncludedPayload>;

export type UserOperationFailedEvent = CanonicalUserOperationEventEnvelope<"userop.failed", UserOperationFailedPayload>;

export type UserOperationFinalizedEvent = CanonicalUserOperationEventEnvelope<
  "userop.finalized",
  UserOperationFinalizedPayload
>;

export const USER_OPERATION_SUBMITTED_PAYLOAD_FIELDS = [
  "status",
  "user_op_hash",
  "user_operation",
  "smart_account",
  "bundler"
] as const;

export const USER_OPERATION_SIMULATED_PAYLOAD_FIELDS = ["status", "user_op_hash", "simulation"] as const;

export const USER_OPERATION_INCLUDED_PAYLOAD_FIELDS = [
  "status",
  "user_op_hash",
  "entry_point",
  "transaction_hash",
  "block_number",
  "block_hash",
  "included_at"
] as const;

export const USER_OPERATION_FAILED_PAYLOAD_FIELDS = [
  "status",
  "user_op_hash",
  "stage",
  "reason_code",
  "retryable",
  "failed_at"
] as const;

export const USER_OPERATION_FINALIZED_PAYLOAD_FIELDS = [
  "status",
  "user_op_hash",
  "transaction_hash",
  "finalized_block_number",
  "confirmations",
  "finalized_at"
] as const;
