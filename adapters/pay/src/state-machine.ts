import { PaymentIntentState } from "@ryvra/contracts";

import { PayConflictError } from "./errors.js";

const STATE_ORDER: Record<PaymentIntentState, number> = {
  [PaymentIntentState.created]: 0,
  [PaymentIntentState.authorized]: 1,
  [PaymentIntentState.executing]: 2,
  [PaymentIntentState.settled]: 3,
  [PaymentIntentState.failed]: 4,
  [PaymentIntentState.reversed]: 5
};

const ALLOWED_TRANSITIONS: Record<PaymentIntentState, readonly PaymentIntentState[]> = {
  [PaymentIntentState.created]: [PaymentIntentState.authorized, PaymentIntentState.executing, PaymentIntentState.failed],
  [PaymentIntentState.authorized]: [PaymentIntentState.executing, PaymentIntentState.failed, PaymentIntentState.reversed],
  [PaymentIntentState.executing]: [PaymentIntentState.settled, PaymentIntentState.failed, PaymentIntentState.reversed],
  [PaymentIntentState.settled]: [PaymentIntentState.reversed],
  [PaymentIntentState.failed]: [],
  [PaymentIntentState.reversed]: []
};

export interface TransitionResult {
  state: PaymentIntentState;
  applied: boolean;
  stale: boolean;
}

export const isCanonicalPaymentIntentState = (state: string): state is PaymentIntentState =>
  Object.values(PaymentIntentState).includes(state as PaymentIntentState);

export const applyPaymentTransition = (
  current: PaymentIntentState,
  next: PaymentIntentState,
  options: { strict?: boolean } = {}
): TransitionResult => {
  if (current === next) {
    return { state: current, applied: false, stale: false };
  }

  if (STATE_ORDER[next] < STATE_ORDER[current]) {
    return { state: current, applied: false, stale: true };
  }

  const allowed = ALLOWED_TRANSITIONS[current];
  if (allowed.includes(next)) {
    return { state: next, applied: true, stale: false };
  }

  if (options.strict) {
    throw new PayConflictError(`Invalid payment state transition ${current} -> ${next}.`);
  }

  return { state: current, applied: false, stale: false };
};
