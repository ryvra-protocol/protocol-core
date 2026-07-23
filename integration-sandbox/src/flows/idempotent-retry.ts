import { PolicyDecision } from "@ryvra/contracts";

import { makeReplayKey, type SandboxContext } from "../context.js";
import { emitEvent } from "../logging/event-log.js";
import { runHappyPathPayment, type HappyPathInput } from "./happy-path-payment.js";

export const runIdempotentRetry = (context: SandboxContext, input: HappyPathInput) => {
  const replayKey = makeReplayKey(input.reference_id, input.idempotency_key);
  const existing = context.intentsByReplayKey.get(replayKey);

  if (!existing) {
    return runHappyPathPayment({ ...input, context });
  }

  context.duplicateAttemptCount += 1;
  const decision = context.decisionsByReference.get(existing.reference_id);
  if (!decision) {
    throw new Error("Expected prior policy decision for idempotent replay.");
  }

  emitEvent(context, existing.reference_id, existing.correlation_id, "idempotency.duplicate_detected", {
    reason_codes: ["DUPLICATE_REFERENCE_REPLAY"],
    prior_decision: decision.decision
  });

  return {
    context,
    result: {
      intent: existing,
      decision: {
        ...decision,
        decision: decision.decision === PolicyDecision.DENY ? PolicyDecision.DENY : PolicyDecision.ALLOW
      },
      settlement_state: context.settlementByReference.get(existing.reference_id),
      ledger_transaction: context.ledgerByReference.get(existing.reference_id),
      contribution_event: context.contributionsByReference.get(existing.reference_id),
      duplicate_detected: true
    }
  };
};
