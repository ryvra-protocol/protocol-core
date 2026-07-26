import type { LedgerPosting, LedgerTransaction } from "@ryvra/contracts";

import { LedgerSettlementValidationError } from "./errors.js";

export const hasDoubleEntryBalance = (postings: readonly LedgerPosting[]): boolean => {
  const debit = postings.filter((posting) => posting.direction === "debit").reduce((sum, posting) => sum + posting.amount_minor, 0);
  const credit = postings
    .filter((posting) => posting.direction === "credit")
    .reduce((sum, posting) => sum + posting.amount_minor, 0);
  return debit === credit;
};

export const assertDoubleEntryBalance = (postings: readonly LedgerPosting[]): void => {
  if (!hasDoubleEntryBalance(postings)) {
    throw new LedgerSettlementValidationError("Double-entry invariant failed: sum(debits) must equal sum(credits).");
  }
};

export const assertNonDestructiveLedgerMutation = (
  existing: LedgerTransaction | undefined,
  incoming: LedgerTransaction
): void => {
  if (!existing) {
    return;
  }

  const existingSerialized = JSON.stringify(existing);
  const incomingSerialized = JSON.stringify(incoming);
  if (existingSerialized !== incomingSerialized) {
    throw new LedgerSettlementValidationError("Destructive ledger mutation is forbidden; use compensating events instead.");
  }
};
