# Ledger-Settlement Adapter Rollout (Phase 2b)

## Adapter architecture and mode behavior

Phase 2b introduces `/adapters/ledger-settlement` as the formal boundary for posting, settlement state transitions, and reconciliation.

- Interface:
  - `postTransaction(input, context)`
  - `advanceSettlement(input, context)`
  - `reconcile(input, context)`
- Input metadata carries canonical identifiers and replay controls (`ledger_event_id`, `posting_id`, `reference_id`, `idempotency_key`, `correlation_id`, optional `policy_version`), plus deterministic clock/id injectors.
- Modes:
  - `deterministic`: default for CI/integration-sandbox, replay-safe, deterministic IDs/timestamps.
  - `http`: real transport boundary with timeout, retry, and breaker-lite protection.

## Canonical enforcement and invariant guarantees

At adapter boundary:

- Canonical ID vocabulary is enforced (`account_id`, `asset_id`, `ledger_event_id`, `posting_id`, `reference_id`, `idempotency_key`, `correlation_id`).
- Settlement state is enforced to exact canonical vocabulary: `accepted | executed | finalized | reconciled | failed`.
- Canonical event envelope fields are enforced: `event_id`, `correlation_id`, `reference_id`, `event_type`, `timestamp`, `payload`.
- Double-entry invariant is enforced before post (`sum(debits) == sum(credits)`), and invalid postings are rejected with typed validation errors.
- Non-canonical drift fields are rejected/dropped at the boundary (including `contribution_id` legacy drift).
- No destructive ledger mutation paths are introduced; corrections remain compensating-event based.

## Idempotency semantics and conflict handling

- Replay key semantics remain `reference_id::idempotency_key` for side-effect dedupe.
- Deterministic mode deduplicates post/advance calls and returns prior deterministic result on duplicate replay.
- HTTP mode supports conflict replay semantics: duplicate conflict can return mapped prior result payload without duplicating financial side effects.
- Same `reference_id + idempotency_key` never duplicates posting/finalization side effects in sandbox flows.

## Settlement lifecycle handling

- Allow path posts balanced ledger transaction then advances settlement through `finalized` -> `reconciled`.
- Deny path does not post/finalize settlement and records failure state with audit event semantics intact.
- Reconciliation report generation is routed through adapter boundary and remains deterministic/schema-stable.

## Error taxonomy and retry policy

- `LedgerSettlementTimeoutError`
- `LedgerSettlementTransportError`
- `LedgerSettlementValidationError`
- `LedgerSettlementConflictError`
- `LedgerSettlementUnavailableError`

Retry policy:

- Per-request timeout control.
- Bounded retries with exponential backoff + jitter fields.
- Optional breaker-lite: failure threshold and cooldown.

## Configuration and environment contract

- `LEDGER_SETTLEMENT_MODE = deterministic | http`
- `LEDGER_SETTLEMENT_BASE_URL` (required in `http` mode)
- `LEDGER_SETTLEMENT_TIMEOUT_MS`
- `LEDGER_SETTLEMENT_MAX_RETRIES`
- `LEDGER_SETTLEMENT_RETRY_BASE_DELAY_MS`
- `LEDGER_SETTLEMENT_FAILURE_THRESHOLD`
- `LEDGER_SETTLEMENT_COOLDOWN_MS`

Deterministic mode remains default in CI-safe sandbox usage.

## Limitations and next milestones

Current PR intentionally does not productionize external banking/chain connectors.

Phase 2c next steps:

- pay boundary hardening
- async callback/finalization race scenario expansion
- reversal/partial-failure scenario expansion
