# @ryvra/integration-sandbox

Deterministic, mock-driven end-to-end sandbox for policy, ledger, settlement, PoT contribution, idempotency replay, and reconciliation reporting.

## Scope

- Policy-risk decisions route through `PolicyRiskAdapter` boundary.
- Deterministic IDs/timestamps for stable test assertions.
- Compensating-event style audit semantics (no destructive ledger operations).
- Non-final policy thresholds and PoT weights are marked as `TBD by governance/policy`.

## Policy-risk adapter configuration

- `POLICY_RISK_MODE=deterministic|http` (default: `deterministic`)
- `POLICY_RISK_BASE_URL` (required for `http` mode)
- `POLICY_RISK_TIMEOUT_MS` (default: `1500`)
- `POLICY_RISK_MAX_RETRIES` (default: `2`)
- `POLICY_RISK_RETRY_BASE_DELAY_MS` (default: `50`)
- `POLICY_RISK_FAILURE_THRESHOLD` (default: `3`)
- `POLICY_RISK_COOLDOWN_MS` (default: `1000`)
