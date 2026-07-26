import test from "node:test";
import assert from "node:assert/strict";

import {
  SettlementState,
  asAccountId,
  asAssetId,
  asCorrelationId,
  asIdempotencyKey,
  asReferenceId
} from "@ryvra/contracts";

import { createDeterministicLedgerSettlementAdapter } from "../src/modes/deterministic.js";

test("deterministic mode posts and advances settlement lifecycle", async () => {
  const adapter = createDeterministicLedgerSettlementAdapter({ mode: "deterministic" });

  const posted = await adapter.postTransaction(
    {
      reference_id: asReferenceId("ref_det_1"),
      correlation_id: asCorrelationId("corr_det_1"),
      idempotency_key: asIdempotencyKey("idem_det_1"),
      postings: [
        {
          account_id: asAccountId("acct_a"),
          asset_id: asAssetId("asset_USDC"),
          amount_minor: 100,
          direction: "debit"
        },
        {
          account_id: asAccountId("acct_b"),
          asset_id: asAssetId("asset_USDC"),
          amount_minor: 100,
          direction: "credit"
        }
      ]
    },
    {
      now: () => "2026-01-01T00:00:00.000Z"
    }
  );

  assert.equal(posted.settlement_state, SettlementState.accepted);

  const finalized = await adapter.advanceSettlement({
    reference_id: asReferenceId("ref_det_1"),
    correlation_id: asCorrelationId("corr_det_1"),
    idempotency_key: asIdempotencyKey("idem_det_1_finalized"),
    next_state: SettlementState.finalized
  });

  assert.equal(finalized.settlement_state, SettlementState.finalized);

  const reconciled = await adapter.advanceSettlement({
    reference_id: asReferenceId("ref_det_1"),
    correlation_id: asCorrelationId("corr_det_1"),
    idempotency_key: asIdempotencyKey("idem_det_1_reconciled"),
    next_state: SettlementState.reconciled
  });

  assert.equal(reconciled.settlement_state, SettlementState.reconciled);
});

test("deterministic conflict replay returns prior result semantics", async () => {
  const adapter = createDeterministicLedgerSettlementAdapter({ mode: "deterministic" });

  const input = {
    reference_id: asReferenceId("ref_conflict"),
    correlation_id: asCorrelationId("corr_conflict"),
    idempotency_key: asIdempotencyKey("idem_conflict"),
    postings: [
      {
        account_id: asAccountId("acct_a"),
        asset_id: asAssetId("asset_USDC"),
        amount_minor: 100,
        direction: "debit" as const
      },
      {
        account_id: asAccountId("acct_b"),
        asset_id: asAssetId("asset_USDC"),
        amount_minor: 100,
        direction: "credit" as const
      }
    ]
  };

  const first = await adapter.postTransaction(input);
  const replay = await adapter.postTransaction(input);

  assert.deepEqual(replay.ledger_transaction, first.ledger_transaction);
});
