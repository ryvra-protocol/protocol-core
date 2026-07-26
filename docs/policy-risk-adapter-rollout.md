# Policy-Risk Adapter Rollout (Phase 2)

## Architecture overview

Phase 2 introduces `/adapters/policy-risk` as a formal boundary between domain flows and policy-risk execution.

- Interface: `PolicyRiskAdapter.evaluate(input, context)`
- Input carries canonical identifiers (`correlation_id`, `reference_id`, `idempotency_key`, `policy_version`)
- Execution modes: deterministic and http
- Core layers: client, mapper, validator, retry/timeout, idempotency, typed errors

## Mode behavior

### Deterministic mode

- Default for CI and integration sandbox
- Uses deterministic in-memory rules and process-scope dedupe on `reference_id::idempotency_key`
- Preserves stable outcomes for existing sandbox scenarios
- Non-final policy thresholds are explicitly marked `TBD by governance/policy`

### HTTP mode

- Uses real transport boundary (`POST /evaluate`)
- Supports per-request timeout, bounded retries with backoff + jitter, and optional breaker-lite cooldown guard
- Forwards idempotency and correlation metadata to upstream via request payload and headers

## Canonical request/response schema

### Outgoing request (adapter -> policy service)

- `account_id`
- `asset_id`
- `amount_minor`
- `reference_id`
- `correlation_id`
- `idempotency_key`
- `policy_version`
- `risk_score`
- `jurisdiction` (optional)

### Incoming response (policy service -> adapter)

Mapped into canonical `PolicyDecisionOutput`:

- `decision`
- `reason_codes`
- `policy_version`
- `evaluated_at`

Non-canonical upstream fields are dropped at the mapper boundary.

## Canonical validation guarantees

- Decision must be `ALLOW | DENY | REVIEW`
- `DENY` must include non-empty machine-readable `reason_codes`
- `reason_codes` must match canonical prefix taxonomy from `@ryvra/contracts`
- Input and output payloads are validated before entering domain flow logic

## Error taxonomy

- `PolicyRiskTimeoutError` (`retryable: true`)
- `PolicyRiskTransportError` (`retryable: true` by default)
- `PolicyRiskValidationError` (`retryable: false`)
- `PolicyRiskUnavailableError` (`retryable: true`)

## Retry and timeout policy

- Configurable timeout per request (`POLICY_RISK_TIMEOUT_MS`)
- Configurable retries with exponential backoff (`POLICY_RISK_MAX_RETRIES`, `POLICY_RISK_RETRY_BASE_DELAY_MS`)
- Optional breaker-lite (`POLICY_RISK_FAILURE_THRESHOLD`, `POLICY_RISK_COOLDOWN_MS`)

## Idempotency behavior

- Deterministic mode dedupes evaluate calls in-process by `reference_id + idempotency_key`
- HTTP mode forwards idempotency key to upstream via `x-idempotency-key` header and canonical payload field
- Sandbox replay flow remains side-effect safe and audit-visible

## Configuration contract

- `POLICY_RISK_MODE = deterministic | http`
- `POLICY_RISK_BASE_URL` (required in http mode)
- `POLICY_RISK_TIMEOUT_MS`
- `POLICY_RISK_MAX_RETRIES`
- `POLICY_RISK_RETRY_BASE_DELAY_MS`
- `POLICY_RISK_FAILURE_THRESHOLD`
- `POLICY_RISK_COOLDOWN_MS`

## Rollout limitations and next steps

- Ledger-settlement real adapter rollout is out of scope for this phase
- Policy-risk upstream behavior beyond canonical boundary remains provider-agnostic
- Next Phase 2 follow-up:
  - ledger-settlement adapter rollout
  - pay flow boundary hardening
  - broader failure/reversal scenario matrix
