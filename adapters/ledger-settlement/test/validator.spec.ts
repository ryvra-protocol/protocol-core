import test from "node:test";
import assert from "node:assert/strict";

import {
  asAccountId,
  asAssetId,
  asCorrelationId,
  asIdempotencyKey,
  asLedgerEventId,
  asPostingId,
  asReferenceId,
  SettlementState
} from "@ryvra/contracts";

import { LedgerSettlementValidationError } from "../src/errors.js";
import { assertAdvanceSettlementInput, assertPostTransactionInput, assertSettlementState } from "../src/validator.js";
import type { PostTransactionInput } from "../src/types.js";

test("validator accepts canonical postTransaction input", () => {
  assert.doesNotThrow(() => {
    assertPostTransactionInput({
      ledger_event_id: asLedgerEventId("evt_1"),
      reference_id: asReferenceId("ref_1"),
      correlation_id: asCorrelationId("corr_1"),
      idempotency_key: asIdempotencyKey("idem_1"),
      postings: [
        {
          posting_id: asPostingId("pst_1"),
          account_id: asAccountId("acct_1"),
          asset_id: asAssetId("asset_1"),
          amount_minor: 100,
          direction: "debit"
        },
        {
          posting_id: asPostingId("pst_2"),
          account_id: asAccountId("acct_2"),
          asset_id: asAssetId("asset_1"),
          amount_minor: 100,
          direction: "credit"
        }
      ] as PostTransactionInput["postings"]
    });
  });
});

test("validator rejects legacy naming drift", () => {
  assert.throws(
    () => {
      assertPostTransactionInput({
        reference_id: asReferenceId("ref_legacy"),
        correlation_id: asCorrelationId("corr_legacy"),
        idempotency_key: asIdempotencyKey("idem_legacy"),
        postings: [
          {
            posting_id: asPostingId("pst_legacy_1"),
            account_id: asAccountId("acct_legacy_1"),
            asset_id: asAssetId("asset_legacy"),
            amount_minor: 10,
            direction: "debit",
            contribution_id: "bad"
          } as never,
          {
            posting_id: asPostingId("pst_legacy_2"),
            account_id: asAccountId("acct_legacy_2"),
            asset_id: asAssetId("asset_legacy"),
            amount_minor: 10,
            direction: "credit"
          }
        ] as PostTransactionInput["postings"]
      });
    },
    (error) => error instanceof LedgerSettlementValidationError
  );
});

test("validator rejects invalid settlement state", () => {
  assert.throws(
    () => {
      assertSettlementState("queued");
    },
    (error) => error instanceof LedgerSettlementValidationError
  );

  assert.equal(assertSettlementState(SettlementState.finalized), SettlementState.finalized);
});

test("validator enforces advanceSettlement metadata", () => {
  assert.throws(
    () => {
      assertAdvanceSettlementInput({
        reference_id: asReferenceId("ref_adv"),
        correlation_id: asCorrelationId("corr_adv"),
        idempotency_key: asIdempotencyKey("idem_adv"),
        next_state: "not-canonical" as never
      });
    },
    (error) => error instanceof LedgerSettlementValidationError
  );
});
