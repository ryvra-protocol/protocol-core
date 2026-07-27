import type { RetryConfig } from "./types.js";

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const backoffDelay = (attempt: number, config: RetryConfig): number => {
  const exponential = config.baseDelayMs * 2 ** attempt;
  const jitter = config.jitterMs > 0 ? Math.floor(Math.random() * config.jitterMs) : 0;
  return exponential + jitter;
};

export const executeWithRetry = async <T>(
  operation: (attempt: number) => Promise<T>,
  config: RetryConfig,
  shouldRetry: (error: unknown) => boolean
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= config.maxRetries || !shouldRetry(error)) {
        throw error;
      }
      await sleep(backoffDelay(attempt, config));
    }
  }

  throw lastError;
};
