export class PayError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable: boolean, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
    this.retryable = retryable;
  }
}

export class PayTimeoutError extends PayError {
  constructor(message = "Pay request timed out", options?: ErrorOptions) {
    super(message, true, options);
  }
}

export class PayTransportError extends PayError {
  constructor(message: string, retryable = true, options?: ErrorOptions) {
    super(message, retryable, options);
  }
}

export class PayValidationError extends PayError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, false, options);
  }
}

export class PayConflictError extends PayError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, false, options);
  }
}

export class PayUnavailableError extends PayError {
  constructor(message = "Pay service unavailable", retryable = true, options?: ErrorOptions) {
    super(message, retryable, options);
  }
}

export class PayWebhookVerificationError extends PayError {
  constructor(message = "Invalid pay webhook signature", options?: ErrorOptions) {
    super(message, false, options);
  }
}
