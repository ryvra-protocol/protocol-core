# @ryvra/integration-sandbox

Deterministic, mock-driven end-to-end sandbox for policy, ledger, settlement, PoT contribution, idempotency replay, and reconciliation reporting.

## Scope

- No external providers.
- Deterministic IDs/timestamps for stable test assertions.
- Compensating-event style audit semantics (no destructive ledger operations).
- Non-final policy thresholds and PoT weights are marked as `TBD by governance/policy`.
