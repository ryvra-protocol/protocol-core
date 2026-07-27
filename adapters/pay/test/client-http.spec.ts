import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";

import { asAccountId, asAssetId, asCorrelationId, asIdempotencyKey, asReferenceId, PaymentIntentState } from "@ryvra/contracts";

import { createHttpPayAdapter } from "../src/modes/http.js";

const input = {
  reference_id: asReferenceId("ref_http"),
  idempotency_key: asIdempotencyKey("idem_http"),
  correlation_id: asCorrelationId("corr_http"),
  amount_minor: 1,
  account_id: asAccountId("acct_http"),
  asset_id: asAssetId("asset_http")
};

test("http client mode maps create result and supports callback reconciliation", async () => {
  const server = createServer((req, res) => {
    if (req.url !== "/payment-intents") {
      res.statusCode = 404;
      res.end();
      return;
    }

    assert.equal(req.headers["x-idempotency-key"], "idem_http");
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ state: "executing", settlement_state: "accepted", reward_eligible: false }));
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("server failed");
  }

  const adapter = createHttpPayAdapter({
    mode: "http",
    baseUrl: `http://127.0.0.1:${address.port}`,
    timeoutMs: 500,
    callbackDedupeTtlMs: 60_000,
    retry: { maxRetries: 0, baseDelayMs: 1, jitterMs: 0 }
  });

  const created = await adapter.createPaymentIntent(input);
  assert.equal(created.intent.state, PaymentIntentState.executing);

  const settled = await adapter.handleProviderCallback({
    ...input,
    event_type: "settled",
    provider_event_id: "evt_pay_1"
  });

  assert.equal(settled.intent.state, PaymentIntentState.settled);
  assert.equal(settled.reward_eligible, true);

  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});
