import { createHmac, timingSafeEqual } from "node:crypto";

import { PayWebhookVerificationError } from "./errors.js";
import { toCanonicalCallbackInput } from "./mapper.js";
import { assertWebhookPayload } from "./validator.js";

const SIGNATURE_PREFIX = "sha256=";

const signPayload = (secret: string, body: string): string =>
  `${SIGNATURE_PREFIX}${createHmac("sha256", secret).update(body).digest("hex")}`;

const safeCompare = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
};

export const verifyWebhookSignature = (input: { secret?: string; signature?: string; rawBody?: string }): void => {
  if (!input.secret) {
    return;
  }
  if (!input.signature || !input.rawBody) {
    throw new PayWebhookVerificationError("Webhook signature/raw body required when PAY_WEBHOOK_SECRET is configured.");
  }

  const expected = signPayload(input.secret, input.rawBody);
  if (!safeCompare(expected, input.signature)) {
    throw new PayWebhookVerificationError();
  }
};

export const parseWebhookCallback = (input: {
  payload: unknown;
  secret?: string;
  signature?: string;
  rawBody?: string;
}) => {
  verifyWebhookSignature({ secret: input.secret, signature: input.signature, rawBody: input.rawBody });
  const payload = assertWebhookPayload(input.payload);
  return toCanonicalCallbackInput(payload);
};

export const createWebhookSignature = (secret: string, rawBody: string): string => signPayload(secret, rawBody);
