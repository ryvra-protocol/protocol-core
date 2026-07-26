import { PolicyDecision, SettlementState, asIdempotencyKey, type ReconciliationReport, type ReferenceId } from "@ryvra/contracts";

import type { SandboxContext } from "../context.js";

export const buildReconciliationReport = async (context: SandboxContext): Promise<ReconciliationReport> => {
  const decisions = Array.from(context.decisionsByReference.entries());
  const allowedReferences = decisions
    .filter(([, decision]) => decision.decision === PolicyDecision.ALLOW)
    .map(([reference_id]) => reference_id);

  const reconciliation = await context.ledgerSettlementAdapter.reconcile({
    reference_id: allowedReferences[0] ?? context.nextReferenceId(),
    correlation_id: context.nextCorrelationId(),
    idempotency_key:
      context.intentsByReplayKey.values().next().value?.idempotency_key ?? asIdempotencyKey("idem_reconcile_fallback"),
    reference_ids: allowedReferences
  });
  for (const item of reconciliation.items) {
    if (item.settlement_state) {
      context.settlementByReference.set(item.reference_id, item.settlement_state);
    }
  }

  const unreconciled_items: Array<{ reference_id: ReferenceId; reason: string }> = [];
  for (const [reference_id, decision] of decisions) {
    const settlement = context.settlementByReference.get(reference_id);
    if (decision.decision === PolicyDecision.DENY) {
      continue;
    }
    if (settlement !== SettlementState.reconciled) {
      unreconciled_items.push({ reference_id, reason: settlement ?? "missing_settlement" });
    }
  }

  unreconciled_items.sort((a, b) => `${a.reference_id}`.localeCompare(`${b.reference_id}`));

  return {
    total_intents: context.intentsByReplayKey.size,
    allowed_count: decisions.filter(([, decision]) => decision.decision === PolicyDecision.ALLOW).length,
    denied_count: decisions.filter(([, decision]) => decision.decision === PolicyDecision.DENY).length,
    finalized_count: Array.from(context.settlementByReference.values()).filter((state) => state === SettlementState.finalized).length,
    reconciled_count: Array.from(context.settlementByReference.values()).filter((state) => state === SettlementState.reconciled).length,
    failed_transitions_count: context.failedTransitionsCount,
    duplicate_attempt_count: context.duplicateAttemptCount,
    unreconciled_items
  };
};
