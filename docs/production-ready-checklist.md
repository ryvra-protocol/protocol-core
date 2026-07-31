# Production Ready Checklist

## Contracts integrity

- [x] DONE: Canonical schema baseline declared (`contracts/src/version.ts`, `docs/compatibility-matrix.md`).
- [x] DONE: Contract compile/type compatibility covered (`contracts/test/contracts-compile.spec.ts`, `.github/workflows/ci.yml`).

## Adapter reliability

- [x] DONE: Retry/timeout/idempotency coverage present for adapters (`adapters/*/test/retry.spec.ts`, `adapters/*/test/idempotency.spec.ts`).
- [x] DONE: Late callback and terminal-state regression coverage present (`integration-sandbox/test/pay-reliability.spec.ts`).
- [x] DONE: Reconciliation correctness tests present (`integration-sandbox/test/reconciliation.spec.ts`).

## CI enforcement

- [x] DONE: Required check candidates defined (`.github/workflows/ci.yml`).
- [x] DONE: Toolchain/version consistency check added (`scripts/validate-version-consistency.mjs`, `pnpm validate:versions`).
- [ ] PARTIAL: Branch protection enforcement pending manual GitHub settings (`docs/branch-protection-required-settings.md`).

## Security posture

- [x] DONE: Security reporting + triage SLA documented (`SECURITY.md`).
- [x] DONE: Dependency policy and update cadence documented (`docs/dependency-policy.md`).
- [x] DONE: Incident response template/checklist available (`docs/incident-response-template.md`).

## Release and rollback readiness

- [x] DONE: RC packaging docs created (`CHANGELOG.md`, `docs/release-candidate.md`).
- [x] DONE: Production cutover runbook documented (`docs/production-cutover-runbook.md`).
- [x] DONE: Rollback triggers/actions documented (`docs/rollback-runbook.md`).

## Observability and runbooks

- [x] DONE: Staging HTTP verification checklist and evidence expectations documented (`docs/staging-http-mode-verification.md`).
- [ ] PARTIAL: Real staging HTTP-mode execution requires external environment secrets/endpoints (see env contract in `docs/staging-http-mode-verification.md`).
- [ ] TODO: Attach latest production canary dashboard links in release channel at cutover time.
