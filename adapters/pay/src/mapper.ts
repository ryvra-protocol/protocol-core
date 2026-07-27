import { asCorrelationId, asIdempotencyKey, asReferenceId, PaymentIntentState } from "@ryvra/contracts";

import { PayValidationError } from "./errors.js";
import type { PayCallbackInput, PayCallbackType } from "./types.js";
import { assertCanonicalState } from "./validator.js";

export interface UpstreamPayCreateRequest {
  reference_id: string;
  idempotency_key: string;
  correlation_id: string;
  amount_minor: number;
  account_id: string;
  asset_id: string;
}

export interface UpstreamPayResponse {
  state?: string;
  settlement_state?: string;
  timed_out_pending_callback?: boolean;
  reward_eligible?: boolean;
}

export const toUpstreamCreateRequest = (input: UpstreamPayCreateRequest): UpstreamPayCreateRequest => ({
  ...input
});

const EVENT_TO_STATE: Record<PayCallbackType, PaymentIntentState> = {
  authorized: PaymentIntentState.authorized,
  executing: PaymentIntentState.executing,
  settled: PaymentIntentState.settled,
  failed: PaymentIntentState.failed,
  reversed: PaymentIntentState.reversed
};

export const mapCallbackEventToState = (eventType: string): PaymentIntentState => {
  const state = EVENT_TO_STATE[eventType as PayCallbackType];
  if (!state) {
    throw new PayValidationError(`Unsupported callback event_type: ${eventType}`);
  }
  return state;
};

export const toCanonicalCallbackInput = (payload: Record<string, unknown>): PayCallbackInput => {
  const eventType = `${payload.event_type}`;
  const mappedState = mapCallbackEventToState(eventType);
  assertCanonicalState(mappedState);

  return {
    reference_id: asReferenceId(`${payload.reference_id}`),
    idempotency_key: asIdempotencyKey(`${payload.idempotency_key}`),
    correlation_id: asCorrelationId(`${payload.correlation_id}`),
    event_type: eventType as PayCallbackType,
    provider_event_id: typeof payload.provider_event_id === "string" ? payload.provider_event_id : undefined,
    payload
  };
};

export const toCanonicalHttpResponse = (payload: UpstreamPayResponse): {
  state: PaymentIntentState;
  settlement_state?: string;
  timed_out_pending_callback: boolean;
  reward_eligible: boolean;
} => {
  const state = assertCanonicalState(payload.state ?? PaymentIntentState.executing);
  return {
    state,
    settlement_state: payload.settlement_state,
    timed_out_pending_callback: payload.timed_out_pending_callback === true,
    reward_eligible: payload.reward_eligible === true
  };
};
