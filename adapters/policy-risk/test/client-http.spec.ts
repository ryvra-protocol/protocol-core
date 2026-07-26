import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";

import {
  asAccountId,
  asAssetId,
  asCorrelationId,
  asIdempotencyKey,
  asPolicyVersion,
  asReferenceId
} from "@ryvra/contracts";

import { createHttpPolicyRiskAdapter } from "../src/modes/http.js";
import { PolicyRiskTimeoutError } from "../src/errors.js";

const evaluateInput = {
  account_id: asAccountId("acct_http"),
  asset_id: asAssetId("asset_http"),
  amount_minor: 10,
  reference_id: asReferenceId("ref_http"),
  policy_version: asPolicyVersion("policy-2026-01"),
  correlation_id: asCorrelationId("corr_http"),
  idempotency_key: asIdempotencyKey("idem_http"),
  risk_score: 20
};

test("http mode forwards idempotency header and maps response", async () => {
  const server = createServer((req, res) => {
    if (req.url !== "/evaluate") {
      res.statusCode = 404;
      res.end();
      return;
    }

    assert.equal(req.headers["x-idempotency-key"], "idem_http");

    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        decision: "ALLOW",
        reason_codes: [],
        policy_version: "policy-2026-01",
        evaluated_at: "2026-01-01T00:00:00.000Z",
        ignored_field: "value"
      })
    );
  });

  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Server did not start with TCP address.");
  }

  const adapter = createHttpPolicyRiskAdapter({
    mode: "http",
    baseUrl: `http://127.0.0.1:${address.port}`,
    timeoutMs: 500,
    retry: { maxRetries: 0, baseDelayMs: 1, jitterMs: 0 }
  });

  const result = await adapter.evaluate(evaluateInput);
  assert.equal(result.decision, "ALLOW");

  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("http mode throws timeout error", async () => {
  const server = createServer((_req, res) => {
    setTimeout(() => {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ decision: "ALLOW", reason_codes: [] }));
    }, 50);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Server did not start with TCP address.");
  }

  const adapter = createHttpPolicyRiskAdapter({
    mode: "http",
    baseUrl: `http://127.0.0.1:${address.port}`,
    timeoutMs: 1,
    retry: { maxRetries: 0, baseDelayMs: 1, jitterMs: 0 }
  });

  await assert.rejects(adapter.evaluate(evaluateInput), (error) => error instanceof PolicyRiskTimeoutError);

  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
