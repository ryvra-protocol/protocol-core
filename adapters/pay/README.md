# @ryvra/pay-adapter

Pay adapter boundary for protocol-core Phase 2c hardening.

## Modes

- `deterministic` (default for CI/sandbox): deterministic in-memory state machine, callback dedupe, outbox ordering.
- `http`: transport boundary with timeout, retry/backoff+jitter, and optional breaker-lite.

## Canonical guarantees

- Payment states remain exactly: `created | authorized | executing | settled | failed | reversed`.
- `reference_id`, `idempotency_key`, and `correlation_id` are required across create/callback/query operations.
- Callback replays are deduplicated (`provider_event_id` or canonical fallback key).
- Duplicate callback processing is idempotent and emits duplicate audit reason codes (`DUPLICATE_REFERENCE_*`).
- Stale/out-of-order callbacks are safely ignored as no-op transitions.
- Outbox emits canonical event envelopes (`event_id`, `correlation_id`, `reference_id`, `event_type`, `timestamp`, `payload`).
- Rewards/PoT eligibility emits only on valid settled/reconciled success paths.

## Persistence boundary hooks

- Deterministic and http modes both accept optional runtime persistence hooks:
  - `persistence.callbackDedupeStore` for callback replay dedupe state
  - `persistence.outbox` for canonical envelope outbox state
- Defaults remain in-memory for CI-safe deterministic execution.

## Environment contract

- `PAY_MODE` = `deterministic | http` (default: `deterministic`)
- `PAY_BASE_URL` (required when `PAY_MODE=http`)
- `PAY_TIMEOUT_MS` (default: `1500`)
- `PAY_MAX_RETRIES` (default: `2`)
- `PAY_RETRY_BASE_DELAY_MS` (default: `50`)
- `PAY_FAILURE_THRESHOLD` (default: `3`)
- `PAY_COOLDOWN_MS` (default: `1000`)
- `PAY_WEBHOOK_SECRET` (optional; if set, webhook signature verification is required)
- `PAY_CALLBACK_DEDUPE_TTL_MS` (default: `300000`)
