import test from "node:test";
import assert from "node:assert/strict";

import { PolicyDecision, SettlementState } from "@ryvra/contracts";

import { asset, createSandboxContext, idempotency, reference, account } from "../src/context.js";
import { hasDoubleEntryBalance } from "../src/mocks/ledger-settlement.mock.js";
import { runHappyPathPayment } from "../src/flows/happy-path-payment.js";

test("happy path reaches finalized/reconciled and emits PoT contribution", () => {
  const context = createSandboxContext();
  const { result, context: updated } = runHappyPathPayment({
    context,
    payer: account("acct_alice"),
    payee: account("acct_bob"),
    asset_id: asset("asset_USDC"),
    amount_minor: 5000,
    reference_id: reference("ref_happy"),
    idempotency_key: idempotency("idem_happy"),
    risk_score: 10
  });

  assert.equal(result.decision.decision, PolicyDecision.ALLOW);
  assert.equal(result.settlement_state, SettlementState.reconciled);
  assert.ok(result.contribution_event);
  assert.ok(result.ledger_transaction);
  assert.equal(hasDoubleEntryBalance(result.ledger_transaction!), true);

  const eventTypes = updated.events.map((event) => event.event_type);
  assert.deepEqual(eventTypes, [
    "payment_intent.created",
    "policy.decision",
    "ledger.transaction_created",
    "settlement.finalized",
    "settlement.reconciled",
    "pot.contribution_emitted"
  ]);
});
