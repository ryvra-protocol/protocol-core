import { CANONICAL_EVENT_ENVELOPE_FIELDS, SettlementState } from "@ryvra/contracts";

import { hasDoubleEntryBalance } from "./invariant.js";
import { LedgerSettlementValidationError } from "./errors.js";
import type {
  AdvanceSettlementInput,
  PostTransactionInput,
  ReconcileInput,
  ReconcileOutput
} from "./types.js";

const CANONICAL_SETTLEMENT_STATES = new Set(Object.values(SettlementState));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const assertSettlementState = (value: string): SettlementState => {
  if (!CANONICAL_SETTLEMENT_STATES.has(value as SettlementState)) {
    throw new LedgerSettlementValidationError("Settlement state must match canonical vocabulary.");
  }
  return value as SettlementState;
};

export const assertPostTransactionInput = (input: PostTransactionInput): void => {
  if (!input.reference_id || !input.correlation_id || !input.idempotency_key) {
    throw new LedgerSettlementValidationError("Transaction input missing canonical identifiers.");
  }

  if (!Array.isArray(input.postings) || input.postings.length < 2) {
    throw new LedgerSettlementValidationError("Transaction input requires at least two postings.");
  }

  for (const posting of input.postings) {
    if (!posting.account_id || !posting.asset_id) {
      throw new LedgerSettlementValidationError("Posting missing canonical account_id/asset_id.");
    }
    if (posting.direction !== "debit" && posting.direction !== "credit") {
      throw new LedgerSettlementValidationError("Posting direction must be debit or credit.");
    }
    if (!Number.isFinite(posting.amount_minor) || posting.amount_minor <= 0) {
      throw new LedgerSettlementValidationError("Posting amount_minor must be finite and > 0.");
    }
  }

  if (!hasDoubleEntryBalance({ postings: input.postings })) {
    throw new LedgerSettlementValidationError("Double-entry invariant violation: sum debits must equal sum credits.");
  }
};

export const assertAdvanceSettlementInput = (input: AdvanceSettlementInput): void => {
  if (!input.reference_id || !input.correlation_id || !input.idempotency_key) {
    throw new LedgerSettlementValidationError("Settlement advance input missing canonical identifiers.");
  }
  input.next_state = assertSettlementState(input.next_state);
};

export const assertReconcileInput = (input: ReconcileInput): void => {
  if (!Number.isFinite(input.total_intents) || input.total_intents < 0) {
    throw new LedgerSettlementValidationError("Reconcile input total_intents must be a non-negative integer.");
  }
  for (const settlement of input.settlements) {
    settlement.state = assertSettlementState(settlement.state);
  }
};

export const assertCanonicalEnvelope = (value: unknown): void => {
  if (!isRecord(value)) {
    throw new LedgerSettlementValidationError("Event envelope must be an object.");
  }

  const keys = Object.keys(value);
  if (keys.length !== CANONICAL_EVENT_ENVELOPE_FIELDS.length) {
    throw new LedgerSettlementValidationError("Event envelope must only contain canonical fields.");
  }
  for (const field of CANONICAL_EVENT_ENVELOPE_FIELDS) {
    if (!keys.includes(field)) {
      throw new LedgerSettlementValidationError(`Event envelope missing canonical field ${field}.`);
    }
  }
};

export const assertReconciliationOutput = (output: ReconcileOutput): void => {
  const report = output.report;
  const required = [
    "total_intents",
    "allowed_count",
    "denied_count",
    "finalized_count",
    "reconciled_count",
    "failed_transitions_count",
    "duplicate_attempt_count",
    "unreconciled_items"
  ] as const;

  for (const key of required) {
    if (!(key in report)) {
      throw new LedgerSettlementValidationError(`Reconciliation output missing ${key}.`);
    }
  }
  if (!Array.isArray(report.unreconciled_items)) {
    throw new LedgerSettlementValidationError("Reconciliation output unreconciled_items must be an array.");
  }
};

export const assertNoLegacyDrift = (payload: Record<string, unknown>): void => {
  if ("contribution_id" in payload || "contributionId" in payload) {
    throw new LedgerSettlementValidationError("Legacy contribution_id drift is forbidden at adapter boundary.");
  }
};

export const assertObjectPayload = (payload: unknown, label: string): Record<string, unknown> => {
  if (!isRecord(payload)) {
    throw new LedgerSettlementValidationError(`${label} payload must be an object.`);
  }
  return payload;
};
