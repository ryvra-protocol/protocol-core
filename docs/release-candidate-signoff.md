# Release Candidate Signoff - `v1.0.0-rc.1`

Date: 2026-07-31  
Repository: `ryvra-protocol/protocol-core`

## Signoff matrix

| Function | Owner role | Signoff status | Evidence link | Notes |
| --- | --- | --- | --- | --- |
| Core Eng | Engineering Lead (Protocol Core) | OPERATIONALIZED (GO pre-approved) | `docs/final-cutover-decision.md`; `contracts/freeze/contract-freeze.json`; `contracts/test/schema-snapshot.spec.ts` | H4 freeze controls and deterministic schema checks added; no GO/NO-GO re-evaluation in this PR |
| Ops/SRE | Operations Lead / On-call Commander | OPERATIONALIZED (GO pre-approved) | `docs/production-cutover-runbook.md`; `docs/rollback-runbook.md`; `docs/compatibility-matrix.md` | Rollback and compatibility mismatch guidance aligned to frozen contract baseline |
| Security | Security Reviewer | OPERATIONALIZED (GO pre-approved) | `SECURITY.md`; `.github/workflows/ci.yml`; `docs/cutover-evidence-index.md` | Dependency/security checks remain required in CI and linked in evidence index |
| Product/Protocol owner | Product/Protocol Owner | OPERATIONALIZED (GO pre-approved) | `docs/final-cutover-decision.md`; `docs/production-readiness-gate-report.md` | Scope constrained to freeze/enforcement artifacts and release signoff evidence |

## Known limitations

1. Branch protection enforcement is still a GitHub settings action (`docs/branch-protection-required-settings.md`).
2. Staging HTTP-mode verification artifacts must be linked from environment-owned runs (`docs/staging-http-mode-verification.md`).
3. PR reconciliation closure actions require API permissions unavailable in this execution context (`docs/pr-reconciliation-final-cutover.md`).

## Deferred items

| Item | Owner role | Target date | Rationale |
| --- | --- | --- | --- |
| Distributed persistence for dedupe/outbox state | Core Eng + Platform | 2026-08-15 | Current in-memory controls are release-acceptable but not multi-instance durable |
| Production canary dashboard permalink attachment | Ops/SRE | 2026-08-01 | Final run links are generated at execution time |
| Cross-repo status field completion (all repos GREEN/YELLOW/RED with evidence links) | Program Mgmt + Repo owners | 2026-08-02 | Depends on downstream repo validation runs |

## H4 hardening signoff artifacts

- Freeze policy + canonical export surface: `contracts/freeze/contract-freeze.json`
- Compatibility fixture + matrix: `contracts/fixtures/downstream-compatibility-fixtures.json`, `docs/compatibility-matrix.md`
- Deterministic schema snapshot: `contracts/fixtures/schema-snapshot.v1.json`, `contracts/test/schema-snapshot.spec.ts`
- Version/export-surface CI guardrail: `scripts/validate-version-consistency.mjs`
