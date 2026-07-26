import type { LedgerPosting, LedgerTransaction } from "@ryvra/contracts";

import { LedgerSettlementValidationError } from "./errors.js";

export const hasDoubleEntryBalance = (input: readonly LedgerPosting[] | LedgerTransaction): boolean => {
  const normalized: readonly LedgerPosting[] = "postings" in input ? input.postings : input;
  const debit = normalized
    .filter((posting: LedgerPosting) => posting.direction === "debit")
    .reduce((sum: number, posting: LedgerPosting) => sum + posting.amount_minor, 0);
  const credit = normalized
    .filter((posting: LedgerPosting) => posting.direction === "credit")
    .reduce((sum: number, posting: LedgerPosting) => sum + posting.amount_minor, 0);
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
