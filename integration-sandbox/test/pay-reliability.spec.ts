import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";

import {
  PaymentIntentState,
  asAccountId,
  asAssetId,
  asCorrelationId,
  asIdempotencyKey,
  asReferenceId
} from "@ryvra/contracts";
import { createHttpPayAdapter, createDeterministicPayRuntimeAdapter } from "@ryvra/pay-adapter";

const makeInput = (suffix: string) => ({
  reference_id: asReferenceId(`ref_${suffix}`),
  idempotency_key: asIdempotencyKey(`idem_${suffix}`),
  correlation_id: asCorrelationId(`corr_${suffix}`),
  amount_minor: 100,
  account_id: asAccountId(`acct_${suffix}`),
  asset_id: asAssetId("asset_USDC")
});

test("duplicate callback replay does not duplicate side effects", async () => {
  const { adapter, runtime } = createDeterministicPayRuntimeAdapter({ mode: "deterministic", callbackDedupeTtlMs: 60_000 });
  const input = makeInput("dup");

  await adapter.createPaymentIntent(input);
  await adapter.handleProviderCallback({ ...input, event_type: "settled", provider_event_id: "evt_dup_1" });
  const duplicate = await adapter.handleProviderCallback({ ...input, event_type: "settled", provider_event_id: "evt_dup_1" });

  assert.equal(duplicate.duplicate_detected, true);
  assert.equal(runtime.outbox.all().filter((entry) => entry.envelope.event_type === "pot.contribution_eligible").length, 1);
});

test("out-of-order callback is stale-safe no-op", async () => {
  const { adapter, runtime } = createDeterministicPayRuntimeAdapter({ mode: "deterministic", callbackDedupeTtlMs: 60_000 });
  const input = makeInput("stale");

  await adapter.createPaymentIntent(input);
  await adapter.handleProviderCallback({ ...input, event_type: "settled", provider_event_id: "evt_stale_settled" });
  const stale = await adapter.handleProviderCallback({ ...input, event_type: "authorized", provider_event_id: "evt_stale_auth" });

  assert.equal(stale.intent.state, PaymentIntentState.settled);
  assert.equal(runtime.outbox.all().some((entry) => entry.envelope.event_type === "callback.stale_ignored"), true);
});

test("late success callback after timeout reconciles once", async () => {
  const server = createServer((_req, res) => {
    setTimeout(() => {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ state: "executing", settlement_state: "accepted", reward_eligible: false }));
    }, 40);
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("server failed to bind");
  }

  const adapter = createHttpPayAdapter({
    mode: "http",
    baseUrl: `http://127.0.0.1:${address.port}`,
    timeoutMs: 1,
    callbackDedupeTtlMs: 60_000,
    retry: { maxRetries: 0, baseDelayMs: 1, jitterMs: 0 }
  });

  const input = makeInput("timeout");
  const timeoutResult = await adapter.createPaymentIntent(input);
  assert.equal(timeoutResult.intent.state, PaymentIntentState.executing);
  assert.equal(timeoutResult.reward_eligible, false);

  const settled = await adapter.handleProviderCallback({ ...input, event_type: "settled", provider_event_id: "evt_timeout_1" });
  const duplicate = await adapter.handleProviderCallback({ ...input, event_type: "settled", provider_event_id: "evt_timeout_1" });

  assert.equal(settled.intent.state, PaymentIntentState.settled);
  assert.equal(settled.reward_eligible, true);
  assert.equal(duplicate.duplicate_detected, true);

  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test("late failed callback after terminal success is stale-safe and does not corrupt state", async () => {
  const { adapter, runtime } = createDeterministicPayRuntimeAdapter({ mode: "deterministic", callbackDedupeTtlMs: 60_000 });
  const input = makeInput("late_failed");

  await adapter.createPaymentIntent(input);
  await adapter.handleProviderCallback({ ...input, event_type: "settled", provider_event_id: "evt_late_failed_settled" });
  const lateFailed = await adapter.handleProviderCallback({
    ...input,
    event_type: "failed",
    provider_event_id: "evt_late_failed_failed"
  });

  assert.equal(lateFailed.intent.state, PaymentIntentState.settled);
  assert.equal(lateFailed.reward_eligible, true);
  assert.equal(runtime.outbox.all().some((entry) => entry.envelope.event_type === "callback.stale_ignored"), true);
});

test("rewards stay blocked on failed and unreconciled paths", async () => {
  const { adapter } = createDeterministicPayRuntimeAdapter({ mode: "deterministic", callbackDedupeTtlMs: 60_000 });
  const input = makeInput("failed");

  const created = await adapter.createPaymentIntent(input);
  assert.equal(created.reward_eligible, false);

  const failed = await adapter.handleProviderCallback({ ...input, event_type: "failed", provider_event_id: "evt_failed_1" });
  assert.equal(failed.reward_eligible, false);
  assert.equal(failed.intent.state, PaymentIntentState.failed);
});

test("reversal uses compensating-event semantics", async () => {
  const { adapter, runtime } = createDeterministicPayRuntimeAdapter({ mode: "deterministic", callbackDedupeTtlMs: 60_000 });
  const input = makeInput("reverse");

  await adapter.createPaymentIntent(input);
  await adapter.handleProviderCallback({ ...input, event_type: "settled", provider_event_id: "evt_rev_settled" });
  const reversed = await adapter.handleProviderCallback({ ...input, event_type: "reversed", provider_event_id: "evt_rev_reversed" });

  assert.equal(reversed.intent.state, PaymentIntentState.reversed);
  assert.equal(reversed.reward_eligible, false);
  assert.equal(
    runtime.outbox.all().some((entry) => entry.envelope.event_type === "payment_intent.reversed_compensating_event"),
    true
  );
});
