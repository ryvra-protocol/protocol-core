# @ryvra/ledger-settlement-adapter

Ledger-settlement adapter boundary for protocol-core Phase 2b rollout.

## Modes

- `deterministic` (default for CI/sandbox): in-memory deterministic posting/settlement and replay-safe idempotency behavior.
- `http`: real transport boundary with timeout, bounded retries, and optional breaker-lite controls.

## Canonical contract guarantees

- Canonical IDs enforced: `account_id`, `asset_id`, `ledger_event_id`, `posting_id`, `reference_id`, `idempotency_key`, `correlation_id`.
- Settlement state enforced to `accepted | executed | finalized | reconciled | failed`.
- Canonical event envelope enforced: `event_id`, `correlation_id`, `reference_id`, `event_type`, `timestamp`, `payload`.
- Double-entry invariant enforced before posting (`sum(debits) === sum(credits)`).
- No destructive ledger mutations; corrections must use compensating events.
- Mapper canonicalizes and drops non-canonical drift fields such as `contribution_id`.

## Environment contract

- `LEDGER_SETTLEMENT_MODE` = `deterministic | http` (default: `deterministic`)
- `LEDGER_SETTLEMENT_BASE_URL` (required in `http` mode)
- `LEDGER_SETTLEMENT_TIMEOUT_MS` (default: `1500`)
- `LEDGER_SETTLEMENT_MAX_RETRIES` (default: `2`)
- `LEDGER_SETTLEMENT_RETRY_BASE_DELAY_MS` (default: `50`)
- `LEDGER_SETTLEMENT_FAILURE_THRESHOLD` (default: `3`)
- `LEDGER_SETTLEMENT_COOLDOWN_MS` (default: `1000`)
