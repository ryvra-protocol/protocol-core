export class LedgerSettlementError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable: boolean, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
    this.retryable = retryable;
  }
}

export class LedgerSettlementTimeoutError extends LedgerSettlementError {
  constructor(message = "Ledger-settlement request timed out", options?: ErrorOptions) {
    super(message, true, options);
  }
}

export class LedgerSettlementTransportError extends LedgerSettlementError {
  constructor(message: string, retryable = true, options?: ErrorOptions) {
    super(message, retryable, options);
  }
}

export class LedgerSettlementValidationError extends LedgerSettlementError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, false, options);
  }
}

export class LedgerSettlementConflictError extends LedgerSettlementError {
  readonly priorResult?: unknown;

  constructor(message = "Ledger-settlement idempotency conflict", priorResult?: unknown, options?: ErrorOptions) {
    super(message, false, options);
    this.priorResult = priorResult;
  }
}

export class LedgerSettlementUnavailableError extends LedgerSettlementError {
  constructor(message = "Ledger-settlement service unavailable", retryable = true, options?: ErrorOptions) {
    super(message, retryable, options);
  }
}
