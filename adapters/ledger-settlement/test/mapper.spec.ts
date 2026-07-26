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

import {
  toCanonicalReconciliation,
  toCanonicalSettlementState,
  toCanonicalTransaction,
  toUpstreamPostTransactionRequest
} from "../src/mapper.js";

test("mapper translates canonical post input to upstream payload", () => {
  const mapped = toUpstreamPostTransactionRequest({
    reference_id: asReferenceId("ref_1"),
    correlation_id: asCorrelationId("corr_1"),
    idempotency_key: asIdempotencyKey("idem_1"),
    postings: [
      {
        account_id: asAccountId("acct_1"),
        asset_id: asAssetId("asset_1"),
        amount_minor: 5,
        direction: "debit"
      },
      {
        account_id: asAccountId("acct_2"),
        asset_id: asAssetId("asset_1"),
        amount_minor: 5,
        direction: "credit"
      }
    ]
  });

  assert.equal(mapped.reference_id, "ref_1");
  assert.equal(mapped.idempotency_key, "idem_1");
});

test("mapper canonicalizes transaction response and drops drift fields", () => {
  const mapped = toCanonicalTransaction(
    {
      ledgerEventId: "evt_upstream",
      referenceId: "ref_upstream",
      postings: [
        { postingId: "pst_a", accountId: "acct_a", assetId: "asset_a", amountMinor: 10, direction: "debit" },
        { postingId: "pst_b", accountId: "acct_b", assetId: "asset_a", amountMinor: 10, direction: "credit" }
      ],
      contribution_id: "legacy"
    },
    {
      ledgerEventId: "evt_fallback",
      referenceId: "ref_fallback"
    }
  );

  assert.equal(mapped.ledger_event_id, "evt_upstream");
  assert.equal((mapped as unknown as Record<string, unknown>).contribution_id, undefined);
});

test("mapper rejects non-canonical settlement state by validator usage", () => {
  const state = toCanonicalSettlementState({ settlementState: "executed" }, SettlementState.accepted);
  assert.equal(state, SettlementState.executed);
});

test("mapper canonicalizes reconciliation payload", () => {
  const output = toCanonicalReconciliation(
    {
      totalIntents: 1,
      allowedCount: 1,
      deniedCount: 0,
      finalizedCount: 0,
      reconciledCount: 1,
      failedTransitionsCount: 0,
      duplicateAttemptCount: 0,
      unreconciledItems: []
    },
    { total_intents: 1, duplicate_attempt_count: 0, failed_transitions_count: 0, decisions: [], settlements: [] }
  );

  assert.equal(output.report.reconciled_count, 1);
});
