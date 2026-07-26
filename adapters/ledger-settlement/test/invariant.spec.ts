import test from "node:test";
import assert from "node:assert/strict";

import { asAccountId, asAssetId, asLedgerEventId, asPostingId, asReferenceId, type LedgerPosting } from "@ryvra/contracts";

import { LedgerSettlementValidationError } from "../src/errors.js";
import { assertDoubleEntryBalance, assertNonDestructiveLedgerMutation, hasDoubleEntryBalance } from "../src/invariant.js";

const balanced: [LedgerPosting, LedgerPosting] = [
  {
    posting_id: asPostingId("pst_i_1"),
    account_id: asAccountId("acct_i_1"),
    asset_id: asAssetId("asset_i"),
    amount_minor: 10,
    direction: "debit" as const
  },
  {
    posting_id: asPostingId("pst_i_2"),
    account_id: asAccountId("acct_i_2"),
    asset_id: asAssetId("asset_i"),
    amount_minor: 10,
    direction: "credit" as const
  }
];

test("double-entry invariant passes for balanced postings", () => {
  assert.equal(hasDoubleEntryBalance(balanced), true);
  assert.doesNotThrow(() => assertDoubleEntryBalance(balanced));
});

test("double-entry invariant rejects unbalanced postings", () => {
  const unbalanced = [balanced[0], { ...balanced[1], amount_minor: 11 }];
  assert.equal(hasDoubleEntryBalance(unbalanced), false);
  assert.throws(() => assertDoubleEntryBalance(unbalanced), (error) => error instanceof LedgerSettlementValidationError);
});

test("non-destructive guard rejects mutated prior ledger tx", () => {
  const existing = {
    ledger_event_id: asLedgerEventId("evt_existing"),
    reference_id: asReferenceId("ref_existing"),
    postings: balanced,
    created_at: "2026-01-01T00:00:00.000Z"
  };
  const incoming = {
    ...existing,
    postings: [balanced[0], { ...balanced[1], amount_minor: 12 }]
  };

  assert.throws(
    () => assertNonDestructiveLedgerMutation(existing, incoming as never),
    (error) => error instanceof LedgerSettlementValidationError
  );
});
