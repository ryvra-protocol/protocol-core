# Pay Boundary Hardening (Phase 2c)

## Architecture and modes

Phase 2c introduces a formal pay adapter boundary at `adapters/pay` with a canonical `PayAdapter` interface:

- `createPaymentIntent(...)`
- `handleProviderCallback(...)`
- `queryPaymentStatus(...)`

All methods require canonical metadata propagation:

- `reference_id`
- `idempotency_key`
- `correlation_id`

Runtime modes:

- `deterministic` (default for CI): deterministic in-memory runtime with strict transition guards, callback dedupe, and deterministic outbox ordering.
- `http`: external boundary with timeout/retry behavior and normalized typed errors, while preserving deterministic callback reconciliation semantics.

## Callback dedupe and ordering rules

Callback ingestion is hardened with parse/validate/verify boundaries:

- Webhook payload parsing requires canonical callback metadata fields.
- Optional signature verification is enforced when `PAY_WEBHOOK_SECRET` is configured.
- Callback dedupe key precedence:
  1. `provider_event_id` (when present)
  2. fallback `reference_id::idempotency_key::event_type`

Ordering and replay behavior:

- Duplicate callback replay is processed as idempotent no-op for side effects and emits duplicate audit signal (`DUPLICATE_REFERENCE_CALLBACK_REPLAY`).
- Stale/out-of-order callbacks are ignored with explicit stale audit events.
- Monotonic progression is enforced by the canonical pay state machine.

## Canonical state machine and idempotency guarantees

Canonical payment state vocabulary remains exact and unchanged:

- `created`
- `authorized`
- `executing`
- `settled`
- `failed`
- `reversed`

Guards:

- Invalid transitions are rejected (`PayConflictError`).
- Stale backwards transitions are safe no-op.
- Same `reference_id + idempotency_key` replay returns prior deterministic result.

Timeout reconciliation:

- If create times out in `http` mode, flow records `executing` pending callback.
- Late success callback can settle exactly once with no duplicate side effects.

## Outbox and event delivery semantics

Pay boundary emits canonical event envelopes:

- `event_id`
- `correlation_id`
- `reference_id`
- `event_type`
- `timestamp`
- `payload`

Outbox behavior:

- In-memory outbox dedupes by delivery key.
- At-least-once delivery is supported without duplicate business effects.
- Deterministic ordering supports stable CI assertions.

## Rewards gating policy

Reward/PoT eligibility is emitted only on valid settled/reconciled success path.

Explicitly blocked paths:

- denied (policy path)
- failed
- unreconciled/pending
- reversed

## Error taxonomy and retry policy

Typed normalized errors:

- `PayTimeoutError`
- `PayTransportError`
- `PayValidationError`
- `PayConflictError`
- `PayUnavailableError`
- `PayWebhookVerificationError`

Resilience controls:

- bounded retries (`PAY_MAX_RETRIES`)
- exponential backoff + jitter support
- request timeout (`PAY_TIMEOUT_MS`)
- optional breaker-lite (`PAY_FAILURE_THRESHOLD`, `PAY_COOLDOWN_MS`)

## Environment contract

- `PAY_MODE=deterministic|http` (default: `deterministic`)
- `PAY_BASE_URL` (required for `http`)
- `PAY_TIMEOUT_MS`
- `PAY_MAX_RETRIES`
- `PAY_RETRY_BASE_DELAY_MS`
- `PAY_FAILURE_THRESHOLD`
- `PAY_COOLDOWN_MS`
- `PAY_WEBHOOK_SECRET`
- `PAY_CALLBACK_DEDUPE_TTL_MS`

No secrets are hardcoded.

## Limitations and next steps

- In-memory callback dedupe/outbox is process-scoped; distributed dedupe/outbox persistence is Phase 3.
- Webhook signature strategy is lightweight; provider-specific canonicalization hardening is a Phase 3 staging task.
- Add observability/SLO gates and staging chaos drills around callback latency/replay patterns in Phase 3.
