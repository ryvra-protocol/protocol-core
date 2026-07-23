import {
  SettlementState,
  type AccountId,
  type AssetId,
  type LedgerPosting,
  type LedgerTransaction,
  type ReferenceId
} from "@ryvra/contracts";

import type { SandboxContext } from "../context.js";

export const createBalancedTransaction = (
  context: SandboxContext,
  params: {
    reference_id: ReferenceId;
    from_account_id: AccountId;
    to_account_id: AccountId;
    asset_id: AssetId;
    amount_minor: number;
  }
): LedgerTransaction => {
  const debit: LedgerPosting = {
    posting_id: context.nextPostingId(),
    account_id: params.from_account_id,
    asset_id: params.asset_id,
    amount_minor: params.amount_minor,
    direction: "debit"
  };
  const credit: LedgerPosting = {
    posting_id: context.nextPostingId(),
    account_id: params.to_account_id,
    asset_id: params.asset_id,
    amount_minor: params.amount_minor,
    direction: "credit"
  };

  const tx: LedgerTransaction = {
    ledger_event_id: context.nextEventId(),
    reference_id: params.reference_id,
    postings: [debit, credit],
    created_at: context.now()
  };

  context.ledgerByReference.set(params.reference_id, tx);
  return tx;
};

export const hasDoubleEntryBalance = (tx: LedgerTransaction): boolean => {
  const debit = tx.postings.filter((posting) => posting.direction === "debit").reduce((sum, posting) => sum + posting.amount_minor, 0);
  const credit = tx.postings
    .filter((posting) => posting.direction === "credit")
    .reduce((sum, posting) => sum + posting.amount_minor, 0);
  return debit === credit;
};

export const transitionSettlement = (
  context: SandboxContext,
  referenceId: ReferenceId,
  nextState: SettlementState
): SettlementState => {
  if (nextState === SettlementState.failed) {
    context.failedTransitionsCount += 1;
  }

  context.settlementByReference.set(referenceId, nextState);
  return nextState;
};
