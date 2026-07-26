# Integration Sandbox E2E

## Happy path sequence

1. Create account records for payer/payee in sandbox context.
2. Create payment intent with deterministic `reference_id`, `idempotency_key`, and `correlation_id`.
3. Evaluate policy through `PolicyRiskAdapter.evaluate(...)` and receive `ALLOW`.
4. Post balanced double-entry ledger transaction through `LedgerSettlementAdapter.postTransaction(...)`.
5. Advance settlement through `LedgerSettlementAdapter.advanceSettlement(...)` to `finalized`, then `reconciled`.
6. Emit PoT `ContributionEvent` with canonical `ledger_event_id`.
7. Persist ordered event envelope log with deterministic timestamps.

## Denied path sequence

1. Create payment intent.
2. Evaluate policy through `PolicyRiskAdapter.evaluate(...)` and receive `DENY`.
3. Include non-empty machine-readable `reason_codes`.
4. Record denial event for audit trail.
5. Do not create finalized settlement posting.

## Idempotency behavior

- Replay key is `reference_id::idempotency_key`.
- First request stores deterministic result across policy + ledger-settlement boundaries.
- Replayed request returns prior result and avoids duplicate ledger postings.
- Duplicate replay emits `idempotency.duplicate_detected` with `DUPLICATE_REFERENCE_*` reason code.

## Reconciliation report schema

- `total_intents`
- `allowed_count`
- `denied_count`
- `finalized_count`
- `reconciled_count`
- `failed_transitions_count`
- `duplicate_attempt_count`
- `unreconciled_items[]`

## Post-alignment verification

- Canonical alignment baseline `v0.2.1-contract-hardening` verification completed.
- Happy path: pass (`ALLOW` decision, balanced double-entry ledger, settlement reaches `finalized` then `reconciled`, PoT contribution event emits canonical `ledger_event_id` and canonical envelope fields).
- Denied path: pass (`DENY` decision with non-empty machine-readable `reason_codes`; no finalized settlement posting occurs).
- Idempotent replay: pass (same `reference_id + idempotency_key` avoids duplicate side effects/postings and emits duplicate audit reason code in `DUPLICATE_REFERENCE_*` family).
- Reconciliation report: pass (deterministic structure and counts for `total_intents`, `allowed_count`, `denied_count`, `finalized_count`, `reconciled_count`, `failed_transitions_count`, `duplicate_attempt_count`, `unreconciled_items[]`).

## Adapter boundary note

Policy-risk decisions and ledger-settlement execution now route through real adapter boundaries in sandbox flows.
Deterministic mode remains the default in CI and tests to preserve deterministic coverage and schema-stable reconciliation.

## Known limitations and next steps

- Policy-risk deterministic thresholds and PoT contribution weights are `TBD by governance/policy`.
- HTTP mode is boundary-complete but external provider production hardening remains out of scope for this phase.
- Broaden scenario matrix for market flows, reversals, and partial failures in subsequent iterations.
- Expand real adapter integration coverage across accounts, asset-registry, ledger-settlement, pay, and markets.
