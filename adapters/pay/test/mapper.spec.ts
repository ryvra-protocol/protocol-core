import test from "node:test";
import assert from "node:assert/strict";

import { PaymentIntentState } from "@ryvra/contracts";

import { mapCallbackEventToState, toCanonicalHttpResponse } from "../src/mapper.js";
import { PayValidationError } from "../src/errors.js";

test("mapper converts callback events to canonical states", () => {
  assert.equal(mapCallbackEventToState("settled"), PaymentIntentState.settled);
  assert.equal(mapCallbackEventToState("failed"), PaymentIntentState.failed);
});

test("mapper rejects unknown callback type", () => {
  assert.throws(() => mapCallbackEventToState("weird"), (error) => error instanceof PayValidationError);
});

test("mapper validates canonical http response state", () => {
  const mapped = toCanonicalHttpResponse({ state: "executing", reward_eligible: false });
  assert.equal(mapped.state, PaymentIntentState.executing);
});
