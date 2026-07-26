import test from "node:test";
import assert from "node:assert/strict";

import { asAccountId, asAssetId, asCorrelationId, asIdempotencyKey, asReferenceId, PaymentIntentState } from "@ryvra/contracts";

import { createDeterministicPayAdapter } from "../src/modes/deterministic.js";

const input = {
  reference_id: asReferenceId("ref_det"),
  idempotency_key: asIdempotencyKey("idem_det"),
  correlation_id: asCorrelationId("corr_det"),
  amount_minor: 100,
  account_id: asAccountId("acct_det"),
  asset_id: asAssetId("asset_det")
};

test("deterministic client enforces callback dedupe and idempotent transitions", async () => {
  const adapter = createDeterministicPayAdapter({
    mode: "deterministic",
    callbackDedupeTtlMs: 60_000
  });

  const created = await adapter.createPaymentIntent(input);
  assert.equal(created.intent.state, PaymentIntentState.executing);

  const first = await adapter.handleProviderCallback({ ...input, event_type: "settled", provider_event_id: "evt_1" });
  const duplicate = await adapter.handleProviderCallback({ ...input, event_type: "settled", provider_event_id: "evt_1" });

  assert.equal(first.intent.state, PaymentIntentState.settled);
  assert.equal(first.reward_eligible, true);
  assert.equal(duplicate.duplicate_detected, true);
});
