# Integration Sandbox E2E

## Happy path sequence

1. Create account records for payer/payee in sandbox context.
2. Create payment intent with deterministic `reference_id`, `idempotency_key`, and `correlation_id`.
3. Evaluate policy through `PolicyRiskAdapter.evaluate(...)` and receive `ALLOW`.
4. Post balanced double-entry ledger transaction through `LedgerSettlementAdapter.postTransaction(...)` (`sum(debit) == sum(credit)`).
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
- First request stores deterministic result.
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

Policy-risk decisions now route through a real adapter boundary in sandbox flows.
Ledger/settlement operations now route through a real adapter boundary in sandbox flows.
Pay callback/retry reconciliation semantics are now covered via `@ryvra/pay-adapter` deterministic/http reliability scenarios.
Deterministic mode remains the default in CI and tests to preserve deterministic coverage.

## Phase 2c reliability outcomes

- Duplicate callback replay: pass (no duplicate side effects; duplicate audit signal emitted).
- Out-of-order callback handling: pass (stale callbacks ignored safely).
- Timeout-then-success: pass (pending execution reconciles to settled exactly once on late success callback).
- Late-failure-after-success: pass (terminal settled state is stale-safe and not corrupted by late failed callback).
- Rewards gating: pass (no rewards on denied/failed/unreconciled/reversed outcomes).
- Reversal handling: pass (compensating-event semantics; no destructive mutation path).
- Canonical envelope/state vocabulary drift checks: pass (no legacy `contribution_id` reintroduced; canonical fields unchanged).

## Known limitations and next steps

- Policy-risk deterministic thresholds and PoT contribution weights are `TBD by governance/policy`.
- No external settlement/ledger provider connectivity in this baseline.
- Broaden scenario matrix for market flows, reversals, and partial failures in subsequent iterations.
- Expand real adapter integration coverage across accounts, asset-registry, ledger-settlement, pay, and markets.
