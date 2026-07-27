import test from "node:test";
import assert from "node:assert/strict";

import { asAccountId, asAssetId, asCorrelationId, asIdempotencyKey, asReferenceId } from "@ryvra/contracts";

import { PayValidationError } from "../src/errors.js";
import { assertCallbackInput, assertCreatePaymentIntentInput } from "../src/validator.js";

test("validator accepts create input with canonical metadata", () => {
  assert.doesNotThrow(() => {
    assertCreatePaymentIntentInput({
      reference_id: asReferenceId("ref_1"),
      idempotency_key: asIdempotencyKey("idem_1"),
      correlation_id: asCorrelationId("corr_1"),
      amount_minor: 100,
      account_id: asAccountId("acct_1"),
      asset_id: asAssetId("asset_1")
    });
  });
});

test("validator rejects invalid callback input", () => {
  assert.throws(
    () => {
      assertCallbackInput({
        reference_id: asReferenceId("ref_1"),
        idempotency_key: asIdempotencyKey("idem_1"),
        correlation_id: asCorrelationId("corr_1"),
        event_type: "" as "authorized"
      });
    },
    (error) => error instanceof PayValidationError
  );
});
