import test from "node:test";
import assert from "node:assert/strict";

import { PaymentIntentState } from "@ryvra/contracts";

import { PayConflictError } from "../src/errors.js";
import { applyPaymentTransition } from "../src/state-machine.js";

test("state machine applies valid forward transition", () => {
  const transition = applyPaymentTransition(PaymentIntentState.executing, PaymentIntentState.settled);
  assert.equal(transition.applied, true);
  assert.equal(transition.state, PaymentIntentState.settled);
});

test("state machine treats out-of-order callback as stale no-op", () => {
  const transition = applyPaymentTransition(PaymentIntentState.settled, PaymentIntentState.authorized);
  assert.equal(transition.applied, false);
  assert.equal(transition.stale, true);
  assert.equal(transition.state, PaymentIntentState.settled);
});

test("state machine rejects invalid transition in strict mode", () => {
  assert.throws(
    () => applyPaymentTransition(PaymentIntentState.created, PaymentIntentState.reversed, { strict: true }),
    (error) => error instanceof PayConflictError
  );
});
