import test from "node:test";
import assert from "node:assert/strict";

import { PayWebhookVerificationError } from "../src/errors.js";
import { createWebhookSignature, parseWebhookCallback } from "../src/webhooks.js";

test("webhook parser verifies signature and maps callback payload", () => {
  const payload = {
    reference_id: "ref_wh",
    idempotency_key: "idem_wh",
    correlation_id: "corr_wh",
    event_type: "settled",
    provider_event_id: "evt_provider_1"
  };
  const rawBody = JSON.stringify(payload);
  const secret = "top-secret";
  const signature = createWebhookSignature(secret, rawBody);

  const callback = parseWebhookCallback({ payload, rawBody, secret, signature });
  assert.equal(callback.event_type, "settled");
  assert.equal(callback.provider_event_id, "evt_provider_1");
});

test("webhook parser rejects invalid signature", () => {
  const payload = {
    reference_id: "ref_wh",
    idempotency_key: "idem_wh",
    correlation_id: "corr_wh",
    event_type: "settled"
  };

  assert.throws(
    () => {
      parseWebhookCallback({ payload, rawBody: JSON.stringify(payload), secret: "secret", signature: "sha256=bad" });
    },
    (error) => error instanceof PayWebhookVerificationError
  );
});
