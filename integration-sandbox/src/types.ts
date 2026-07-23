import type {
  ContributionEvent,
  EventEnvelope,
  LedgerTransaction,
  PaymentIntent,
  PolicyDecisionOutput,
  ReconciliationReport,
  ReferenceId,
  SettlementState
} from "@ryvra/contracts";

export interface PaymentFlowResult {
  intent: PaymentIntent;
  decision: PolicyDecisionOutput;
  settlement_state?: SettlementState;
  ledger_transaction?: LedgerTransaction;
  contribution_event?: ContributionEvent;
  duplicate_detected: boolean;
}

export interface SandboxSnapshot {
  intents: PaymentIntent[];
  decisions: PolicyDecisionOutput[];
  ledger_transactions: LedgerTransaction[];
  settlement_states: Map<ReferenceId, SettlementState>;
  contributions: ContributionEvent[];
  duplicate_attempt_count: number;
  failed_transitions_count: number;
  event_log: EventEnvelope<unknown>[];
}

export type ReconciliationResult = ReconciliationReport;
