export class PolicyRiskError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable: boolean, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
    this.retryable = retryable;
  }
}

export class PolicyRiskTimeoutError extends PolicyRiskError {
  constructor(message = "Policy risk request timed out", options?: ErrorOptions) {
    super(message, true, options);
  }
}

export class PolicyRiskTransportError extends PolicyRiskError {
  constructor(message: string, retryable = true, options?: ErrorOptions) {
    super(message, retryable, options);
  }
}

export class PolicyRiskValidationError extends PolicyRiskError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, false, options);
  }
}

export class PolicyRiskUnavailableError extends PolicyRiskError {
  constructor(message = "Policy risk service unavailable", retryable = true, options?: ErrorOptions) {
    super(message, retryable, options);
  }
}
