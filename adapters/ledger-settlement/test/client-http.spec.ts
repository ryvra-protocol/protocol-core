import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";

import {
  SettlementState,
  asAccountId,
  asAssetId,
  asCorrelationId,
  asIdempotencyKey,
  asPostingId,
  asReferenceId
} from "@ryvra/contracts";

import { createHttpLedgerSettlementAdapter } from "../src/modes/http.js";
import { LedgerSettlementTimeoutError, LedgerSettlementValidationError } from "../src/errors.js";
import type { PostTransactionInput } from "../src/types.js";

const evaluateInput: PostTransactionInput = {
  reference_id: asReferenceId("ref_http"),
  correlation_id: asCorrelationId("corr_http"),
  idempotency_key: asIdempotencyKey("idem_http"),
  postings: [
    {
      posting_id: asPostingId("pst_http_1"),
      account_id: asAccountId("acct_http_1"),
      asset_id: asAssetId("asset_http"),
      amount_minor: 10,
      direction: "debit" as const
    },
    {
      posting_id: asPostingId("pst_http_2"),
      account_id: asAccountId("acct_http_2"),
      asset_id: asAssetId("asset_http"),
      amount_minor: 10,
      direction: "credit" as const
    }
  ]
};

test("http mode forwards idempotency and maps canonical response", async () => {
  const server = createServer((req, res) => {
    if (req.url === "/transactions") {
      assert.equal(req.headers["x-idempotency-key"], "idem_http");
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          ledger_event_id: "evt_http_1",
          reference_id: "ref_http",
          postings: evaluateInput.postings,
          created_at: "2026-01-01T00:00:00.000Z",
          settlement_state: "accepted",
          ignored_field: "drop"
        })
      );
      return;
    }

    if (req.url === "/settlements/advance") {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ reference_id: "ref_http", settlement_state: "finalized" }));
      return;
    }

    if (req.url === "/reconcile") {
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          items: [{ reference_id: "ref_http", settlement_state: "reconciled", contribution_id: "drop" }]
        })
      );
      return;
    }

    res.statusCode = 404;
    res.end();
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Server startup failed");
  }

  const adapter = createHttpLedgerSettlementAdapter({
    mode: "http",
    baseUrl: `http://127.0.0.1:${address.port}`,
    timeoutMs: 500,
    retry: { maxRetries: 0, baseDelayMs: 1, jitterMs: 0 }
  });

  const posted = await adapter.postTransaction(evaluateInput);
  assert.equal(posted.settlement_state, SettlementState.accepted);

  const advanced = await adapter.advanceSettlement({
    reference_id: evaluateInput.reference_id,
    correlation_id: evaluateInput.correlation_id,
    idempotency_key: evaluateInput.idempotency_key,
    next_state: SettlementState.finalized
  });
  assert.equal(advanced.settlement_state, SettlementState.finalized);

  const reconciled = await adapter.reconcile({
    reference_id: evaluateInput.reference_id,
    correlation_id: evaluateInput.correlation_id,
    idempotency_key: evaluateInput.idempotency_key,
    reference_ids: [evaluateInput.reference_id]
  });
  assert.equal(reconciled.items[0]?.settlement_state, SettlementState.reconciled);

  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test("http mode timeout path is typed", async () => {
  const server = createServer((_req, res) => {
    setTimeout(() => {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ settlement_state: "accepted" }));
    }, 50);
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Server startup failed");
  }

  const adapter = createHttpLedgerSettlementAdapter({
    mode: "http",
    baseUrl: `http://127.0.0.1:${address.port}`,
    timeoutMs: 1,
    retry: { maxRetries: 0, baseDelayMs: 1, jitterMs: 0 }
  });

  await assert.rejects(adapter.postTransaction(evaluateInput), (error) => error instanceof LedgerSettlementTimeoutError);

  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test("http mode rejects invalid upstream settlement state mapping", async () => {
  const server = createServer((_req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        ledger_event_id: "evt_bad",
        reference_id: "ref_http",
        postings: evaluateInput.postings,
        created_at: "2026-01-01T00:00:00.000Z",
        settlement_state: "queued"
      })
    );
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Server startup failed");
  }

  const adapter = createHttpLedgerSettlementAdapter({
    mode: "http",
    baseUrl: `http://127.0.0.1:${address.port}`,
    timeoutMs: 500,
    retry: { maxRetries: 0, baseDelayMs: 1, jitterMs: 0 }
  });

  await assert.rejects(adapter.postTransaction(evaluateInput), (error) => error instanceof LedgerSettlementValidationError);

  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});
