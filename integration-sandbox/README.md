# @ryvra/integration-sandbox

Deterministic, CI-safe end-to-end sandbox for policy, ledger, settlement, PoT contribution, idempotency replay, and reconciliation reporting.

## Scope

- Policy-risk decisions route through `PolicyRiskAdapter` boundary.
- Ledger/settlement operations route through `LedgerSettlementAdapter` boundary.
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

## Ledger-settlement adapter configuration

- `LEDGER_SETTLEMENT_MODE=deterministic|http` (default: `deterministic`)
- `LEDGER_SETTLEMENT_BASE_URL` (required for `http` mode)
- `LEDGER_SETTLEMENT_TIMEOUT_MS` (default: `1500`)
- `LEDGER_SETTLEMENT_MAX_RETRIES` (default: `2`)
- `LEDGER_SETTLEMENT_RETRY_BASE_DELAY_MS` (default: `50`)
- `LEDGER_SETTLEMENT_FAILURE_THRESHOLD` (default: `3`)
- `LEDGER_SETTLEMENT_COOLDOWN_MS` (default: `1000`)

## Pay adapter configuration

- `PAY_MODE=deterministic|http` (default: `deterministic`)
- `PAY_BASE_URL` (required for `http` mode)
- `PAY_TIMEOUT_MS` (default: `1500`)
- `PAY_MAX_RETRIES` (default: `2`)
- `PAY_RETRY_BASE_DELAY_MS` (default: `50`)
- `PAY_FAILURE_THRESHOLD` (default: `3`)
- `PAY_COOLDOWN_MS` (default: `1000`)
- `PAY_WEBHOOK_SECRET` (optional signature verification secret)
- `PAY_CALLBACK_DEDUPE_TTL_MS` (default: `300000`)
