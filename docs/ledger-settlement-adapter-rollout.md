# Ledger-Settlement Adapter Rollout (Phase 2b)

## Adapter architecture and mode behavior

Phase 2b introduces `/adapters/ledger-settlement` as the formal boundary for ledger posting, settlement advancement, and reconciliation.

- Interface:
  - `postTransaction(input, context)`
  - `advanceSettlement(input, context)`
  - `reconcile(input, context)`
- Core layers: client, modes (deterministic/http), mapper, validator, invariant, idempotency, retry, typed errors.
- Deterministic mode is the default for CI and sandbox.
- HTTP mode enables real transport integration while preserving canonical contract checks.

## Invariant and compensating-event rules

- Double-entry invariant is enforced before posting (`sum(debit) == sum(credit)`).
- Settlement vocabulary is enforced exactly: `accepted | executed | finalized | reconciled | failed`.
- Legacy field drift is blocked at boundary (`contribution_id` is forbidden in ledger-adjacent payloads).
- No destructive ledger mutation is allowed; corrections must be represented as compensating events.

## Idempotency semantics

- Replay key is `reference_id::idempotency_key`.
- Deterministic mode deduplicates by replay key and returns prior result on replay.
- Conflict scenarios preserve prior-side-effect semantics through typed conflict metadata.
- Integration sandbox replay keeps duplicate audit behavior and prevents duplicate financial side effects.

## Settlement lifecycle handling

- Happy path: post accepted transaction, then advance `finalized -> reconciled`.
- Denied path: settlement transitions to `failed` and does not finalize.
- Reconciliation uses adapter boundary and returns deterministic schema-consistent report output.

## Error taxonomy and retry policy

- `LedgerSettlementTimeoutError`
- `LedgerSettlementTransportError`
- `LedgerSettlementValidationError`
- `LedgerSettlementConflictError`
- `LedgerSettlementUnavailableError`

Retry policy:

- Bounded retries with exponential backoff + jitter config fields.
- Per-request timeout enforcement.
- Optional breaker-lite failure threshold and cooldown behavior in HTTP mode.

## Configuration contract

- `LEDGER_SETTLEMENT_MODE = deterministic | http`
- `LEDGER_SETTLEMENT_BASE_URL` (required in http mode)
- `LEDGER_SETTLEMENT_TIMEOUT_MS`
- `LEDGER_SETTLEMENT_MAX_RETRIES`
- `LEDGER_SETTLEMENT_RETRY_BASE_DELAY_MS`
- `LEDGER_SETTLEMENT_FAILURE_THRESHOLD`
- `LEDGER_SETTLEMENT_COOLDOWN_MS`

## Limitations and next milestones

- External provider production hardening remains out of scope in this phase.
- HTTP mode endpoint contract is intentionally minimal for integration rollout.
- Phase 2c next steps:
  - pay boundary hardening
  - async callback/finalization race scenarios
  - reversal/partial-failure scenario expansion
