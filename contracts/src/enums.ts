export enum PolicyDecision {
  ALLOW = "ALLOW",
  DENY = "DENY",
  REVIEW = "REVIEW"
}

export enum PaymentIntentState {
  created = "created",
  authorized = "authorized",
  executing = "executing",
  settled = "settled",
  failed = "failed",
  reversed = "reversed"
}

export enum SettlementState {
  accepted = "accepted",
  executed = "executed",
  finalized = "finalized",
  reconciled = "reconciled",
  failed = "failed"
}

export enum OrderMarketState {
  created = "created",
  validated = "validated",
  routed = "routed",
  partially_filled = "partially_filled",
  filled = "filled",
  canceled = "canceled",
  expired = "expired",
  failed = "failed",
  settled = "settled"
}

export enum UserOpLifecycleStatus {
  submitted = "submitted",
  simulated = "simulated",
  included = "included",
  failed = "failed",
  finalized = "finalized"
}

export enum UserOpSimulationStatus {
  success = "success",
  failure = "failure"
}

export enum UserOpFailureCategory {
  validation = "validation",
  execution = "execution",
  paymaster = "paymaster",
  bundler = "bundler",
  inclusion_timeout = "inclusion_timeout",
  reorg = "reorg",
  unknown = "unknown"
}
