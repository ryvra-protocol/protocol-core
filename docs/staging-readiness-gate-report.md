# Staging Readiness Gate Report (Phase 2c Pay Boundary Hardening)

Date: 2026-07-27  
Repository: `ryvra-protocol/protocol-core`  
Decision scope: Staging go/no-go after canonical contract alignment + adapter boundary hardening + pay reliability hardening.

## Verification execution (deterministic)

- Toolchain pin verified: `pnpm@10.16.0` (root and workspace packages).
- Reproducible install: `pnpm install --frozen-lockfile`.
- Full local gate suite: `pnpm check` (lint + typecheck + tests across contracts, adapters, integration sandbox).
- Additional reliability verification added:
  - `integration-sandbox/test/pay-reliability.spec.ts`
  - `adapters/pay/test/state-machine.spec.ts`

## Gate summary

| Gate | Status | Evidence | Blockers | Remediation |
| --- | --- | --- | --- | --- |
| 1) Contract integrity | PASS | Canonical ID/envelope vocab asserted in `contracts/test/contracts-compile.spec.ts`; DENY reason code and prefix enforcement in `contracts/src/policy.ts`, `adapters/policy-risk/test/validator.spec.ts`; legacy drift guard for `contribution_id` in `adapters/ledger-settlement/src/validator.ts` and related tests. | None | None |
| 2) Adapter boundary isolation | PASS | Flow logic routes via adapters in `integration-sandbox/src/flows/*.ts`; deterministic/http mode coverage in adapter tests; typed error normalization in each adapter `src/errors.ts` + client/mode tests; timeout/retry config-driven via adapter runtime env loaders. | None | None |
| 3) Idempotency + duplicate side-effects | PASS | Replay safety assertions in `integration-sandbox/test/idempotency.spec.ts`; adapter dedupe tests for policy/ledger/pay; no duplicate ledger/finalization/reward side effects under replay. | None | None |
| 4) Callback ordering + replay | PASS | `integration-sandbox/test/pay-reliability.spec.ts` covers duplicate replay, out-of-order, timeout-then-late-success, and late-failure-after-terminal-success stale-safe behavior. | None | None |
| 5) Reconciliation correctness | PASS | Deterministic schema/count assertions in `integration-sandbox/test/reconciliation.spec.ts` for required report fields and stable outputs under fixed fixtures. | None | None |
| 6) Rewards/PoT economic safety | PASS | Positive path reward emission in `integration-sandbox/test/happy-path.spec.ts`; blocked rewards for denied/failed/unreconciled/reversed flows in `integration-sandbox/test/denied-path.spec.ts` and `integration-sandbox/test/pay-reliability.spec.ts`; replay dedupe prevents duplicate reward emission. | None | None |
| 7) CI/toolchain consistency | PASS | `.github/workflows/ci.yml` uses pnpm 10.16.0 + `pnpm install --frozen-lockfile`; contract/sandbox/adapter typecheck+test jobs present; `pnpm-lock.yaml` present; no `package-lock.json`/`yarn.lock`; local full suite green. | None | None |
| 8) Observability + operational readiness | PASS | Correlation and reference propagation present in canonical envelopes (`integration-sandbox/src/logging/event-log.ts`); duplicate/stale callback audit events and timeout/error paths instrumented in pay adapter; metric definitions and alert drafts documented in this report runbook section. | None | None |
| 9) Docs + runbook completeness | PASS | Required docs present and current: `docs/integration-sandbox-e2e.md`, `docs/policy-risk-adapter-rollout.md`, `docs/ledger-settlement-adapter-rollout.md`, `docs/pay-boundary-hardening.md`, `docs/reliability-scenarios-matrix.md`; this report added. | None | None |
| 10) Release packaging | PASS | Proposed tag + release notes + rollback considerations + explicit recommendation included below. | None | None |

## Observability baseline for staging

Required counters/metrics (names may map to equivalent telemetry):

- `policy_decision_allow_total`, `policy_decision_deny_total`, `policy_decision_review_total`
- `settlement_finalization_latency_ms` (p50/p95/p99)
- `reconciliation_lag_seconds`, `reconciliation_unreconciled_count`
- `callback_duplicate_replay_total`, `callback_stale_ignored_total`
- `adapter_timeout_total{adapter=*}`, `adapter_error_total{adapter=*,error_type=*}`

Structured log minimum fields:

- `correlation_id`
- `reference_id`
- `event_type`

Alert threshold draft (TBD tuning in staging):

- Duplicate callback surge: warn `>20/5m`, critical `>100/5m`
- Adapter timeout spike: warn `>2%/5m`, critical `>5%/5m`
- Reconciliation lag: warn `>120s`, critical `>300s` or unreconciled backlog growth for 3 consecutive intervals

## Incident/runbook quick actions

### 1) Duplicate callback surge

1. Confirm increase in `callback_duplicate_replay_total` and `idempotency.duplicate_detected` events.
2. Verify no reward/ledger duplication by checking dedupe keys and business-side-effect counts.
3. If upstream replay storm continues, temporarily increase callback dedupe TTL and rate-limit ingress at edge.
4. Escalate to pay provider with sampled `provider_event_id` + `correlation_id`.

### 2) Adapter timeout spike

1. Check `adapter_timeout_total` by adapter and recent retry outcomes.
2. Validate breaker state (`failureThreshold/cooldown`) and upstream health.
3. Apply staged mitigation: lower concurrency, increase timeout cautiously, keep retries bounded.
4. If timeout remains critical, hold staging promotion and fail over to deterministic fallback where supported.

### 3) Reconciliation lag incident

1. Check `reconciliation_lag_seconds` and `reconciliation_unreconciled_count`.
2. Trigger deterministic reconciliation rerun and compare stable `unreconciled_items`.
3. Inspect stuck references by `reference_id` and terminal settlement state drift.
4. If backlog grows across intervals, pause promotion and open incident for ledger/pay boundary triage.

## Release packaging recommendation

Proposed staging tag: **`v0.4.0-integration-reliability-baseline`**

### Release notes summary

- Hardened:
  - Canonical contract vocabulary enforcement and drift guards
  - Policy-risk, ledger-settlement, and pay adapter boundaries
  - Pay callback dedupe, ordering guards, timeout recovery, deterministic outbox semantics
- Verified:
  - Deterministic idempotency across replay/retry paths
  - Reconciliation report stability and count correctness
  - Rewards/PoT emission safety constraints
- Known limitations:
  - In-memory dedupe/outbox (process-scoped) pending distributed persistence in future phase
  - Some policy/reward thresholds remain explicitly governance-TBD
- Rollback considerations:
  - Revert to prior integration baseline tag and disable `PAY_MODE=http` usage if provider instability appears
  - Preserve compensating-event semantics; do not mutate historical ledger entries

## Final recommendation

- **Go/No-Go:** **GO**
- **Risk classification:** **LOW**
- **Rationale:** All ten gate domains pass with deterministic test evidence, canonical contract adherence, adapter isolation, idempotency/replay safety, and documented operational runbook controls. No blocking defects detected in gate scope.
