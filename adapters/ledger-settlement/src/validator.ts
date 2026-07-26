import { CANONICAL_EVENT_ENVELOPE_FIELDS, SettlementState } from "@ryvra/contracts";

import { LedgerSettlementValidationError } from "./errors.js";
import { assertDoubleEntryBalance } from "./invariant.js";
import type {
  AdvanceSettlementInput,
  PostTransactionInput,
  ReconcileInput,
  ReconcileItem,
  SettlementEnvelope
} from "./types.js";

const CANONICAL_SETTLEMENT_STATES = new Set<string>(Object.values(SettlementState));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const assertCanonicalMetadata = (input: { reference_id: unknown; correlation_id: unknown; idempotency_key: unknown }): void => {
  if (!input.reference_id || !input.correlation_id || !input.idempotency_key) {
    throw new LedgerSettlementValidationError(
      "Ledger-settlement input missing reference_id, correlation_id, or idempotency_key."
    );
  }
};

const assertNoLegacyDrift = (payload: unknown): void => {
  if (!isRecord(payload)) {
    return;
  }
  if ("contribution_id" in payload || "contributionId" in payload) {
    throw new LedgerSettlementValidationError("Legacy drift field contribution_id is forbidden at adapter boundary.");
  }
};

export const assertSettlementState = (state: unknown): SettlementState => {
  if (typeof state !== "string" || !CANONICAL_SETTLEMENT_STATES.has(state)) {
    throw new LedgerSettlementValidationError("Settlement state must be accepted | executed | finalized | reconciled | failed.");
  }
  return state as SettlementState;
};

export const assertPostTransactionInput = (input: PostTransactionInput): void => {
  assertCanonicalMetadata(input);
  if (!Array.isArray(input.postings) || input.postings.length < 2) {
    throw new LedgerSettlementValidationError("Ledger transaction must contain at least two postings.");
  }

  for (const posting of input.postings) {
    assertNoLegacyDrift(posting as unknown);
    if (!posting.posting_id || !posting.account_id || !posting.asset_id) {
      throw new LedgerSettlementValidationError("Posting must include posting_id, account_id, and asset_id.");
    }
    if (!Number.isFinite(posting.amount_minor) || posting.amount_minor < 0) {
      throw new LedgerSettlementValidationError("Posting amount_minor must be a finite non-negative number.");
    }
    if (posting.direction !== "debit" && posting.direction !== "credit") {
      throw new LedgerSettlementValidationError("Posting direction must be debit or credit.");
    }
  }

  assertDoubleEntryBalance(input.postings);
};

export const assertAdvanceSettlementInput = (input: AdvanceSettlementInput): void => {
  assertCanonicalMetadata(input);
  assertSettlementState(input.next_state);
};

export const assertReconcileInput = (input: ReconcileInput): void => {
  assertCanonicalMetadata(input);
  if (!Array.isArray(input.reference_ids)) {
    throw new LedgerSettlementValidationError("Reconcile input reference_ids must be an array.");
  }
};

export const assertCanonicalEnvelope = (envelope: SettlementEnvelope): void => {
  const keys = Object.keys(envelope);
  if (keys.length !== CANONICAL_EVENT_ENVELOPE_FIELDS.length) {
    throw new LedgerSettlementValidationError("Settlement envelope keys do not match canonical schema.");
  }
  for (const field of CANONICAL_EVENT_ENVELOPE_FIELDS) {
    if (!(field in envelope)) {
      throw new LedgerSettlementValidationError(`Settlement envelope missing canonical field ${field}.`);
    }
  }
};

export const assertReconcileItems = (items: unknown): ReconcileItem[] => {
  if (!Array.isArray(items)) {
    throw new LedgerSettlementValidationError("Reconcile response items must be an array.");
  }

  return items.map((item) => {
    if (!isRecord(item) || typeof item.reference_id !== "string") {
      throw new LedgerSettlementValidationError("Reconcile item must include reference_id.");
    }
    if (item.settlement_state !== undefined) {
      assertSettlementState(item.settlement_state);
    }
    return {
      reference_id: item.reference_id as ReconcileItem["reference_id"],
      settlement_state: item.settlement_state as ReconcileItem["settlement_state"]
    };
  });
};
