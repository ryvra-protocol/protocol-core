import test from "node:test";
import assert from "node:assert/strict";

import { PolicyRiskTransportError, PolicyRiskValidationError } from "../src/errors.js";
import { executeWithRetry } from "../src/retry.js";

test("retry retries retryable transport errors", async () => {
  let attempts = 0;

  const result = await executeWithRetry(
    async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new PolicyRiskTransportError("retryable");
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
        throw new PolicyRiskValidationError("bad payload");
      },
      { maxRetries: 4, baseDelayMs: 1, jitterMs: 0 },
      (error) => Boolean((error as { retryable?: boolean }).retryable)
    ),
    (error) => error instanceof PolicyRiskValidationError
  );
});
