import { PaymentIntentState } from "@ryvra/contracts";

import { PayValidationError } from "./errors.js";
import { isCanonicalPaymentIntentState } from "./state-machine.js";
import type { PayCallbackInput, PayCreateInput, PayQueryInput } from "./types.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const assertMeta = (input: { reference_id: string; idempotency_key: string; correlation_id: string }): void => {
  if (!input.reference_id || !input.idempotency_key || !input.correlation_id) {
    throw new PayValidationError("Pay input requires reference_id, idempotency_key, and correlation_id.");
  }
};

export const assertCreatePaymentIntentInput = (input: PayCreateInput): void => {
  assertMeta(input);
  if (!input.account_id || !input.asset_id) {
    throw new PayValidationError("Pay create input requires account_id and asset_id.");
  }
  if (!Number.isFinite(input.amount_minor) || input.amount_minor <= 0) {
    throw new PayValidationError("Pay create input amount_minor must be a finite positive number.");
  }
};

export const assertQueryPaymentStatusInput = (input: PayQueryInput): void => {
  assertMeta(input);
};

export const assertCallbackInput = (input: PayCallbackInput): void => {
  assertMeta(input);
  if (!input.event_type) {
    throw new PayValidationError("Pay callback input requires event_type.");
  }
};

export const assertWebhookPayload = (payload: unknown): Record<string, unknown> => {
  if (!isRecord(payload)) {
    throw new PayValidationError("Webhook payload must be an object.");
  }
  if (typeof payload.reference_id !== "string") {
    throw new PayValidationError("Webhook payload requires string reference_id.");
  }
  if (typeof payload.idempotency_key !== "string") {
    throw new PayValidationError("Webhook payload requires string idempotency_key.");
  }
  if (typeof payload.correlation_id !== "string") {
    throw new PayValidationError("Webhook payload requires string correlation_id.");
  }
  if (typeof payload.event_type !== "string") {
    throw new PayValidationError("Webhook payload requires string event_type.");
  }
  return payload;
};

export const assertCanonicalState = (state: string): PaymentIntentState => {
  if (!isCanonicalPaymentIntentState(state)) {
    throw new PayValidationError("Payment state must remain canonical: created|authorized|executing|settled|failed|reversed.");
  }
  return state;
};
