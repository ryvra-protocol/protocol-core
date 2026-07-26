# @ryvra/ledger-settlement-adapter

Ledger/settlement adapter boundary for protocol-core Phase 2b rollout.

## Modes

- `deterministic` (default for CI/sandbox): deterministic in-memory posting/settlement behavior with idempotency dedupe.
- `http`: real transport boundary with timeout, retry, and optional breaker-lite controls.

## Canonical + invariant guarantees

- Enforces canonical ID fields: `account_id`, `asset_id`, `ledger_event_id`, `posting_id`, `reference_id`, `idempotency_key`, `correlation_id`.
- Enforces settlement state vocabulary: `accepted | executed | finalized | reconciled | failed`.
- Enforces canonical event envelope shape where envelope payloads are validated.
- Enforces double-entry invariant before posting (`sum(debits) === sum(credits)`).
- Uses compensating-event semantics (no destructive ledger mutation).
- Drops non-canonical upstream fields at mapper boundary.

## Idempotency semantics

- Replay key is `reference_id::idempotency_key`.
- Duplicate replay returns prior deterministic result without duplicate financial side effects.
- Conflict handling preserves prior side-effect result semantics.

## Error taxonomy

- `LedgerSettlementTimeoutError`
- `LedgerSettlementTransportError`
- `LedgerSettlementValidationError`
- `LedgerSettlementConflictError`
- `LedgerSettlementUnavailableError`

## Environment contract

- `LEDGER_SETTLEMENT_MODE` = `deterministic | http` (default: `deterministic`)
- `LEDGER_SETTLEMENT_BASE_URL` (required in `http` mode)
- `LEDGER_SETTLEMENT_TIMEOUT_MS` (default: `1500`)
- `LEDGER_SETTLEMENT_MAX_RETRIES` (default: `2`)
- `LEDGER_SETTLEMENT_RETRY_BASE_DELAY_MS` (default: `50`)
- `LEDGER_SETTLEMENT_FAILURE_THRESHOLD` (default: `3`)
- `LEDGER_SETTLEMENT_COOLDOWN_MS` (default: `1000`)
