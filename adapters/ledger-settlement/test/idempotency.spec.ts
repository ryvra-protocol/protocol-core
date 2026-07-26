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

test("deterministic mode deduplicates post by reference_id + idempotency_key", async () => {
  const adapter = createDeterministicLedgerSettlementAdapter({ mode: "deterministic" });

  const common = {
    reference_id: asReferenceId("ref_same"),
    correlation_id: asCorrelationId("corr_same"),
    idempotency_key: asIdempotencyKey("idem_same"),
    postings: [
      {
        account_id: asAccountId("acct_1"),
        asset_id: asAssetId("asset_1"),
        amount_minor: 11,
        direction: "debit" as const
      },
      {
        account_id: asAccountId("acct_2"),
        asset_id: asAssetId("asset_1"),
        amount_minor: 11,
        direction: "credit" as const
      }
    ]
  };

  const first = await adapter.postTransaction(common);
  const replay = await adapter.postTransaction({ ...common, postings: [...common.postings] as typeof common.postings });

  assert.deepEqual(replay.ledger_transaction, first.ledger_transaction);
  assert.equal(replay.settlement_state, SettlementState.accepted);
});
