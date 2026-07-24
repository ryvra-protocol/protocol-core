# Integration Sandbox E2E

## Happy path sequence

1. Create account records for payer/payee in sandbox context.
2. Create payment intent with deterministic `reference_id`, `idempotency_key`, and `correlation_id`.
3. Evaluate policy and receive `ALLOW`.
4. Create balanced double-entry ledger transaction (`sum(debit) == sum(credit)`).
5. Transition settlement to `finalized`, then `reconciled`.
6. Emit PoT `ContributionEvent` with canonical `ledger_event_id`.
7. Persist ordered event envelope log with deterministic timestamps.

## Denied path sequence

1. Create payment intent.
2. Evaluate policy and receive `DENY`.
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

## Known limitations and next steps

- Mocks only; real adapters pending integration.
- Policy thresholds and PoT contribution weights are `TBD by governance/policy`.
- No external settlement/ledger provider connectivity in this baseline.
- Broaden scenario matrix for market flows, reversals, and partial failures in subsequent iterations.
