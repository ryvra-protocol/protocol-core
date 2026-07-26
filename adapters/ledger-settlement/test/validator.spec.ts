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
  assertAdvanceSettlementInput,
  assertCanonicalEnvelope,
  assertPostTransactionInput,
  assertSettlementState
} from "../src/validator.js";
import { LedgerSettlementValidationError } from "../src/errors.js";

test("validator accepts balanced transaction input", () => {
  assert.doesNotThrow(() => {
    assertPostTransactionInput({
      reference_id: asReferenceId("ref_1"),
      correlation_id: asCorrelationId("corr_1"),
      idempotency_key: asIdempotencyKey("idem_1"),
      postings: [
        {
          account_id: asAccountId("acct_1"),
          asset_id: asAssetId("asset_1"),
          amount_minor: 10,
          direction: "debit"
        },
        {
          account_id: asAccountId("acct_2"),
          asset_id: asAssetId("asset_1"),
          amount_minor: 10,
          direction: "credit"
        }
      ]
    });
  });
});

test("validator rejects non-canonical settlement state", () => {
  assert.throws(() => assertSettlementState("done"), (error) => error instanceof LedgerSettlementValidationError);
});

test("validator enforces canonical envelope fields", () => {
  assert.throws(
    () =>
      assertCanonicalEnvelope({
        event_id: "evt_1",
        correlation_id: "corr_1",
        reference_id: "ref_1",
        event_type: "ledger.transaction_created",
        timestamp: "2026-01-01T00:00:00.000Z"
      }),
    (error) => error instanceof LedgerSettlementValidationError
  );
});

test("validator enforces settlement advance input", () => {
  assert.doesNotThrow(() =>
    assertAdvanceSettlementInput({
      reference_id: asReferenceId("ref_1"),
      correlation_id: asCorrelationId("corr_1"),
      idempotency_key: asIdempotencyKey("idem_1"),
      next_state: SettlementState.finalized
    })
  );
});
