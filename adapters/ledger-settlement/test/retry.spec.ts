import test from "node:test";
import assert from "node:assert/strict";

import { executeWithRetry } from "../src/retry.js";
import { LedgerSettlementTransportError, LedgerSettlementValidationError } from "../src/errors.js";

test("retry retries retryable transport errors", async () => {
  let attempts = 0;

  const result = await executeWithRetry(
    async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new LedgerSettlementTransportError("retryable");
      }
      return "ok";
    },
    { maxRetries: 4, baseDelayMs: 1, jitterMs: 0 },
    (error) => Boolean((error as { retryable?: boolean }).retryable)
  );

  assert.equal(result, "ok");
  assert.equal(attempts, 3);
});

test("retry stops on non-retryable errors", async () => {
  await assert.rejects(
    executeWithRetry(
      async () => {
        throw new LedgerSettlementValidationError("bad");
      },
      { maxRetries: 4, baseDelayMs: 1, jitterMs: 0 },
      (error) => Boolean((error as { retryable?: boolean }).retryable)
    ),
    (error) => error instanceof LedgerSettlementValidationError
  );
});
