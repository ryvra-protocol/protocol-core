import test from "node:test";
import assert from "node:assert/strict";

import {
  SettlementState,
  asAccountId,
  asAssetId,
  asCorrelationId,
  asIdempotencyKey,
  asPostingId,
  asReferenceId
} from "@ryvra/contracts";

import { LedgerSettlementConflictError } from "../src/errors.js";
import { createDeterministicLedgerSettlementAdapter } from "../src/modes/deterministic.js";

const input = {
  reference_id: asReferenceId("ref_det"),
  correlation_id: asCorrelationId("corr_det"),
  idempotency_key: asIdempotencyKey("idem_det"),
  postings: [
    {
      posting_id: asPostingId("pst_det_1"),
      account_id: asAccountId("acct_det_1"),
      asset_id: asAssetId("asset_det"),
      amount_minor: 25,
      direction: "debit" as const
    },
    {
      posting_id: asPostingId("pst_det_2"),
      account_id: asAccountId("acct_det_2"),
      asset_id: asAssetId("asset_det"),
      amount_minor: 25,
      direction: "credit" as const
    }
  ]
};

test("deterministic mode deduplicates postTransaction by replay key", async () => {
  const adapter = createDeterministicLedgerSettlementAdapter({ mode: "deterministic" });
  const first = await adapter.postTransaction(input, { now: () => "2026-01-01T00:00:00.000Z" });
  const replay = await adapter.postTransaction(input, { now: () => "2026-01-01T00:00:01.000Z" });

  assert.deepEqual(replay, first);
  assert.equal(first.settlement_state, SettlementState.accepted);
});

test("deterministic mode conflict carries prior result semantics", async () => {
  const adapter = createDeterministicLedgerSettlementAdapter({ mode: "deterministic" });
  await adapter.postTransaction(input);

  await assert.rejects(
    adapter.postTransaction({ ...input, idempotency_key: asIdempotencyKey("idem_conflict") }),
    (error) => error instanceof LedgerSettlementConflictError && Boolean(error.priorResult)
  );
});
