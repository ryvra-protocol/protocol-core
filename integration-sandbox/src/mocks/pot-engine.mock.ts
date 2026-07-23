import type { ContributionEvent, LedgerTransaction } from "@ryvra/contracts";

import type { SandboxContext } from "../context.js";

const CONTRIBUTION_WEIGHT = 1; // TBD by governance/policy

export const emitContribution = (context: SandboxContext, tx: LedgerTransaction): ContributionEvent => {
  const amount_minor = tx.postings[0].amount_minor;
  const contribution: ContributionEvent = {
    ledger_event_id: context.nextEventId(),
    account_id: tx.postings[1].account_id,
    reference_id: tx.reference_id,
    asset_id: tx.postings[1].asset_id,
    amount_minor,
    points_awarded: amount_minor * CONTRIBUTION_WEIGHT,
    scoring_policy: "pot-weight-v1-TBD-by-governance/policy",
    created_at: context.now()
  };

  context.contributionsByReference.set(tx.reference_id, contribution);
  return contribution;
};
