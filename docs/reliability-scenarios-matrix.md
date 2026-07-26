# Reliability Scenarios Matrix (Phase 2c)

| Scenario | Expected behavior | Assertions | Test file reference | Status |
| --- | --- | --- | --- | --- |
| Duplicate callback replay | No duplicate transitions/side effects; duplicate audit signal emitted | `duplicate_detected=true`; single reward side effect; duplicate reason code family `DUPLICATE_REFERENCE_*` | `integration-sandbox/test/pay-reliability.spec.ts` | pass |
| Out-of-order callback | Stale callback ignored as no-op | State remains on newest valid state; stale audit event emitted | `integration-sandbox/test/pay-reliability.spec.ts` | pass |
| Timeout then late success | Timeout leaves pending execution; late callback settles once | Initial state executing/pending; later settled; duplicate late replay no-op | `integration-sandbox/test/pay-reliability.spec.ts` | pass |
| Rewards gating | Rewards only on valid reconciled success path | No rewards on denied/failed/unreconciled/reversed | `integration-sandbox/test/denied-path.spec.ts`, `integration-sandbox/test/pay-reliability.spec.ts` | pass |
| Reversal compensating path | Reversal handled with compensating-event semantics | Reversed terminal state; compensating event emitted; no reward | `integration-sandbox/test/pay-reliability.spec.ts` | pass |
| Idempotent request replay | Same reference/idempotency returns prior deterministic result | No duplicate ledger/contribution side effects | `integration-sandbox/test/idempotency.spec.ts` | pass |
| Reconciliation schema stability | Report shape and counters deterministic | Canonical fields unchanged | `integration-sandbox/test/reconciliation.spec.ts` | pass |
