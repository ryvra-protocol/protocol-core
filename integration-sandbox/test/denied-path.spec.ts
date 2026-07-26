import test from "node:test";
import assert from "node:assert/strict";

import { PolicyDecision, SettlementState, validatePolicyDecisionOutput } from "@ryvra/contracts";

import { account, asset, createSandboxContext, idempotency, reference } from "../src/context.js";
import { runDeniedPathPayment } from "../src/flows/denied-payment.js";

test("denied path emits deny reason codes and no finalized settlement posting", async () => {
  const context = createSandboxContext();
  const { result, context: updated } = await runDeniedPathPayment({
    context,
    payer: account("acct_denied_payer"),
    payee: account("acct_denied_payee"),
    asset_id: asset("asset_BLOCKED"),
    amount_minor: 99,
    reference_id: reference("ref_denied"),
    idempotency_key: idempotency("idem_denied"),
    risk_score: 85
  });

  assert.equal(result.decision.decision, PolicyDecision.DENY);
  assert.ok(result.decision.reason_codes.length > 0);
  assert.equal(validatePolicyDecisionOutput(result.decision), true);
  assert.equal(result.settlement_state, SettlementState.failed);
  assert.equal(updated.ledgerByReference.has(reference("ref_denied")), false);
  assert.equal(updated.events.some((event) => event.event_type === "settlement.finalized"), false);
  assert.equal(updated.events.some((event) => event.event_type === "payment.denied"), true);
});
