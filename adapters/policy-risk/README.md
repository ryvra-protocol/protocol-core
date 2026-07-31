# @ryvra/policy-risk-adapter

Policy-risk adapter boundary for protocol-core Phase 2 rollout.

## Modes

- `deterministic` (default for CI/sandbox): in-memory deterministic evaluation with process-scope idempotency dedupe.
- `http`: real transport boundary with request/response mapping, timeout, retry, and optional breaker-lite controls.

## Canonical contract guarantees

- Adapter enforces decisions in `ALLOW | DENY | REVIEW`.
- `DENY` decisions require non-empty machine-readable `reason_codes`.
- `reason_codes` must follow canonical prefix taxonomy from `@ryvra/contracts`.
- Outgoing input shape and incoming response shape are validated.

## Environment contract

- `POLICY_RISK_MODE` = `deterministic | http` (default: `deterministic`)
- `POLICY_RISK_BASE_URL` (required in `http` mode)
- `POLICY_RISK_TIMEOUT_MS` (default: `1500`)
- `POLICY_RISK_MAX_RETRIES` (default: `2`)
- `POLICY_RISK_RETRY_BASE_DELAY_MS` (default: `50`)
- `POLICY_RISK_FAILURE_THRESHOLD` (default: `3`)
- `POLICY_RISK_COOLDOWN_MS` (default: `1000`)

## Deterministic policy thresholds

- `maxAllowedAmountMinor` and `maxAllowedRiskScore` are supplied by runtime configuration.
- Integration-sandbox defaults come from explicit governance config contracts and can be overridden via:
  - `POLICY_RISK_MAX_ALLOWED_AMOUNT_MINOR` (default: `1000000`)
  - `POLICY_RISK_MAX_ALLOWED_RISK_SCORE` (default: `70`)
