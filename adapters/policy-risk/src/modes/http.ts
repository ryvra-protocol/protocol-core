import {
  PolicyRiskTimeoutError,
  PolicyRiskTransportError,
  PolicyRiskUnavailableError,
  PolicyRiskValidationError
} from "../errors.js";
import { toCanonicalDecisionOutput, toUpstreamRequest } from "../mapper.js";
import { executeWithRetry } from "../retry.js";
import { assertCanonicalDecisionOutput, assertPolicyDecisionInput, assertUpstreamResponsePayload } from "../validator.js";
import type { HttpPolicyRiskAdapterConfig, PolicyRiskAdapter } from "../types.js";

const isAbortError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  return error.name === "AbortError";
};

export const createHttpPolicyRiskAdapter = (config: HttpPolicyRiskAdapterConfig): PolicyRiskAdapter => {
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

  return {
    async evaluate(input, context) {
      assertPolicyDecisionInput(input);

      if (config.circuitBreaker && Date.now() < cooldownUntil) {
        throw new PolicyRiskUnavailableError("Policy risk adapter circuit breaker is cooling down.");
      }

      const operation = async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

        try {
          const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/evaluate`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-idempotency-key": `${input.idempotency_key}`,
              "x-correlation-id": `${input.correlation_id}`
            },
            body: JSON.stringify(toUpstreamRequest(input)),
            signal: context?.signal ?? controller.signal
          });

          if (!response.ok) {
            if (response.status >= 500 || response.status === 429) {
              throw new PolicyRiskTransportError(`Policy risk upstream returned retryable HTTP status ${response.status}.`);
            }
            if (response.status === 503) {
              throw new PolicyRiskUnavailableError("Policy risk upstream is unavailable.");
            }
            throw new PolicyRiskValidationError(`Policy risk upstream returned non-retryable HTTP status ${response.status}.`);
          }

          const parsed = assertUpstreamResponsePayload(await response.json());
          const output = toCanonicalDecisionOutput(
            {
              decision: parsed.decision as string,
              reason_codes: parsed.reason_codes as string[] | undefined,
              policy_version: parsed.policy_version as string | undefined,
              evaluated_at: parsed.evaluated_at as string | undefined,
              reasonCodes: parsed.reasonCodes as string[] | undefined,
              policyVersion: parsed.policyVersion as string | undefined,
              evaluatedAt: parsed.evaluatedAt as string | undefined
            },
            {
              policyVersion: `${input.policy_version}`,
              evaluatedAt: context?.now?.() ?? new Date().toISOString()
            }
          );

          assertCanonicalDecisionOutput(output);
          return output;
        } catch (error) {
          if (isAbortError(error)) {
            throw new PolicyRiskTimeoutError();
          }
          if (error instanceof PolicyRiskValidationError) {
            throw error;
          }
          if (error instanceof PolicyRiskUnavailableError) {
            throw error;
          }
          if (error instanceof PolicyRiskTransportError) {
            throw error;
          }
          throw new PolicyRiskTransportError("Policy risk transport failure.", true, { cause: error as Error });
        } finally {
          clearTimeout(timeout);
        }
      };

      try {
        const output = await executeWithRetry(
          operation,
          config.retry,
          (error) => Boolean((error as { retryable?: boolean }).retryable)
        );
        registerSuccess();
        return output;
      } catch (error) {
        registerFailure();
        throw error;
      }
    }
  };
};
