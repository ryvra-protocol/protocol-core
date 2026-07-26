import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";

import { SettlementState, asAccountId, asAssetId, asCorrelationId, asIdempotencyKey, asReferenceId } from "@ryvra/contracts";

import { createHttpLedgerSettlementAdapter } from "../src/modes/http.js";
import { LedgerSettlementTimeoutError, LedgerSettlementValidationError } from "../src/errors.js";

const postInput = {
  reference_id: asReferenceId("ref_http"),
  correlation_id: asCorrelationId("corr_http"),
  idempotency_key: asIdempotencyKey("idem_http"),
  postings: [
    {
      account_id: asAccountId("acct_1"),
      asset_id: asAssetId("asset_1"),
      amount_minor: 12,
      direction: "debit" as const
    },
    {
      account_id: asAccountId("acct_2"),
      asset_id: asAssetId("asset_1"),
      amount_minor: 12,
      direction: "credit" as const
    }
  ]
};

test("http mode maps post transaction response", async () => {
  const server = createServer((req, res) => {
    if (req.url !== "/transactions") {
      res.statusCode = 404;
      res.end();
      return;
    }

    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        ledger_event_id: "evt_1",
        reference_id: "ref_http",
        settlement_state: "accepted",
        postings: [
          { posting_id: "pst_1", account_id: "acct_1", asset_id: "asset_1", amount_minor: 12, direction: "debit" },
          { posting_id: "pst_2", account_id: "acct_2", asset_id: "asset_1", amount_minor: 12, direction: "credit" }
        ],
        created_at: "2026-01-01T00:00:00.000Z"
      })
    );
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Server did not start.");
  }

  const adapter = createHttpLedgerSettlementAdapter({
    mode: "http",
    baseUrl: `http://127.0.0.1:${address.port}`,
    timeoutMs: 1000,
    retry: { maxRetries: 0, baseDelayMs: 1, jitterMs: 0 }
  });

  const result = await adapter.postTransaction(postInput);
  assert.equal(result.settlement_state, SettlementState.accepted);

  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test("http mode throws timeout", async () => {
  const server = createServer((_req, res) => {
    setTimeout(() => {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ settlement_state: "accepted", postings: [] }));
    }, 50);
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Server did not start.");
  }

  const adapter = createHttpLedgerSettlementAdapter({
    mode: "http",
    baseUrl: `http://127.0.0.1:${address.port}`,
    timeoutMs: 1,
    retry: { maxRetries: 0, baseDelayMs: 1, jitterMs: 0 }
  });

  await assert.rejects(adapter.postTransaction(postInput), (error) => error instanceof LedgerSettlementTimeoutError);

  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test("http mode rejects invalid settlement state mapping", async () => {
  const server = createServer((_req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        ledger_event_id: "evt_2",
        reference_id: "ref_http",
        settlement_state: "complete",
        postings: [
          { posting_id: "pst_1", account_id: "acct_1", asset_id: "asset_1", amount_minor: 12, direction: "debit" },
          { posting_id: "pst_2", account_id: "acct_2", asset_id: "asset_1", amount_minor: 12, direction: "credit" }
        ],
        created_at: "2026-01-01T00:00:00.000Z"
      })
    );
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Server did not start.");
  }

  const adapter = createHttpLedgerSettlementAdapter({
    mode: "http",
    baseUrl: `http://127.0.0.1:${address.port}`,
    timeoutMs: 1000,
    retry: { maxRetries: 0, baseDelayMs: 1, jitterMs: 0 }
  });

  await assert.rejects(adapter.postTransaction(postInput), (error) => error instanceof LedgerSettlementValidationError);

  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});
