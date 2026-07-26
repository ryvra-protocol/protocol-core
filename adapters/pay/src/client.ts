import {
  PayTimeoutError,
  PayTransportError,
  PayUnavailableError,
  PayValidationError
} from "./errors.js";

const isAbortError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  return error.name === "AbortError";
};

export const postJson = async (
  url: string,
  body: unknown,
  options: {
    timeoutMs: number;
    signal?: AbortSignal;
    headers?: Record<string, string>;
  }
): Promise<Record<string, unknown>> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...options.headers
      },
      body: JSON.stringify(body),
      signal: options.signal ?? controller.signal
    });

    if (!response.ok) {
      if (response.status === 503) {
        throw new PayUnavailableError("Pay upstream is unavailable.");
      }
      if (response.status >= 500 || response.status === 429) {
        throw new PayTransportError(`Pay upstream retryable HTTP status ${response.status}.`);
      }
      throw new PayValidationError(`Pay upstream non-retryable HTTP status ${response.status}.`);
    }

    const parsed = (await response.json()) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new PayValidationError("Pay upstream response must be an object.");
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (isAbortError(error)) {
      throw new PayTimeoutError();
    }
    if (
      error instanceof PayTimeoutError ||
      error instanceof PayTransportError ||
      error instanceof PayValidationError ||
      error instanceof PayUnavailableError
    ) {
      throw error;
    }
    throw new PayTransportError("Pay transport failure.", true, { cause: error as Error });
  } finally {
    clearTimeout(timeout);
  }
};
