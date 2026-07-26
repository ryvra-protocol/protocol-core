import type { ReconciliationReport } from "@ryvra/contracts";

import type { SandboxContext } from "../context.js";

export const buildReconciliationReport = async (context: SandboxContext): Promise<ReconciliationReport> => {
  const output = await context.ledgerSettlementAdapter.reconcile(
    {
      total_intents: context.intentsByReplayKey.size,
      duplicate_attempt_count: context.duplicateAttemptCount,
      failed_transitions_count: context.failedTransitionsCount,
      decisions: Array.from(context.decisionsByReference.entries()).map(([reference_id, decision]) => ({
        reference_id,
        decision: decision.decision
      })),
      settlements: Array.from(context.settlementByReference.entries()).map(([reference_id, state]) => ({
        reference_id,
        state
      }))
    },
    {
      now: context.now
    }
  );

  return output.report;
};
