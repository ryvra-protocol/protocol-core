import { PaymentIntentState, SettlementState } from "@ryvra/contracts";

import { postJson } from "../client.js";
import { PayTimeoutError, PayUnavailableError } from "../errors.js";
import { InMemoryIdempotencyCache, payReplayKey } from "../idempotency.js";
import { toCanonicalHttpResponse, toUpstreamCreateRequest } from "../mapper.js";
import { executeWithRetry } from "../retry.js";
import { assertCallbackInput, assertCreatePaymentIntentInput, assertQueryPaymentStatusInput } from "../validator.js";
import {
  createDeterministicPayRuntimeAdapter,
  type InMemoryPayRuntime
} from "./deterministic.js";
import type { HttpPayAdapterConfig, PayAdapter, PayCreateInput, PayQueryResult, PayResult } from "../types.js";

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/$/, "");

export const createHttpPayAdapter = (config: HttpPayAdapterConfig): PayAdapter => {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const cache = new InMemoryIdempotencyCache<PayResult>();
  const { adapter: deterministicAdapter, runtime } = createDeterministicPayRuntimeAdapter({
    mode: "deterministic",
    callbackDedupeTtlMs: config.callbackDedupeTtlMs,
    webhookSecret: config.webhookSecret,
    persistence: config.persistence
  });

  let consecutiveFailures = 0;
  let cooldownUntil = 0;

  const registerFailure = (): void => {
    if (!config.circuitBreaker) {
      return;
    }
    consecutiveFailures += 1;
    if (consecutiveFailures >= config.circuitBreaker.failureThreshold) {
      cooldownUntil = Date.now() + config.circuitBreaker.cooldownMs;
      consecutiveFailures = 0;
    }
  };

  const registerSuccess = (): void => {
    consecutiveFailures = 0;
    cooldownUntil = 0;
  };

  const createOverHttp = async (input: PayCreateInput, signal?: AbortSignal): Promise<PayResult> => {
    const operation = async () => {
      const raw = await postJson(`${baseUrl}/payment-intents`, toUpstreamCreateRequest(input), {
        timeoutMs: config.timeoutMs,
        signal,
        headers: {
          "x-idempotency-key": `${input.idempotency_key}`,
          "x-correlation-id": `${input.correlation_id}`
        }
      });

      const mapped = toCanonicalHttpResponse({
        state: typeof raw.state === "string" ? raw.state : undefined,
        settlement_state: typeof raw.settlement_state === "string" ? raw.settlement_state : undefined,
        timed_out_pending_callback: raw.timed_out_pending_callback === true,
        reward_eligible: raw.reward_eligible === true
      });

      return runtime.upsertFromHttpCreate({
        createInput: input,
        state: mapped.state,
        settlementState: mapped.settlement_state as SettlementState | undefined,
        timedOutPendingCallback: mapped.timed_out_pending_callback,
        rewardEligible: mapped.reward_eligible
      });
    };

    try {
      const result = await executeWithRetry(
        operation,
        config.retry,
        (error) => Boolean((error as { retryable?: boolean }).retryable)
      );
      registerSuccess();
      return result;
    } catch (error) {
      registerFailure();
      if (error instanceof PayTimeoutError) {
        const timeoutResult = runtime.upsertFromHttpCreate({
          createInput: input,
          state: PaymentIntentState.executing,
          settlementState: SettlementState.accepted,
          timedOutPendingCallback: true,
          rewardEligible: false
        });
        runtime.markTimeoutPending({ reference_id: input.reference_id, idempotency_key: input.idempotency_key });
        return timeoutResult;
      }
      throw error;
    }
  };

  return {
    async createPaymentIntent(input, context) {
      assertCreatePaymentIntentInput(input);
      if (config.circuitBreaker && Date.now() < cooldownUntil) {
        throw new PayUnavailableError("Pay adapter circuit breaker is cooling down.");
      }

      const key = payReplayKey(input.reference_id, input.idempotency_key);
      return cache.dedupe(key, async () => createOverHttp(input, context?.signal));
    },

    async handleProviderCallback(input, context) {
      assertCallbackInput(input);
      return deterministicAdapter.handleProviderCallback(input, context);
    },

    async queryPaymentStatus(input): Promise<PayQueryResult> {
      assertQueryPaymentStatusInput(input);
      return deterministicAdapter.queryPaymentStatus(input);
    }
  };
};

export const getHttpPayRuntime = (adapter: PayAdapter): InMemoryPayRuntime | undefined => {
  const maybe = adapter as PayAdapter & { runtime?: InMemoryPayRuntime };
  return maybe.runtime;
};
