# Release Candidate Signoff - `v1.0.0-rc.1`

Date: 2026-07-31  
Repository: `ryvra-protocol/protocol-core`

## Signoff matrix

| Function | Owner role | Signoff status | Evidence link | Notes |
| --- | --- | --- | --- | --- |
| Core Eng | Engineering Lead (Protocol Core) | PENDING | Add link to CI + RC check run | Validate `pnpm release:rc:check`, `pnpm typecheck`, `pnpm test` on candidate SHA |
| Ops/SRE | Operations Lead / On-call Commander | PENDING | Add staging artifact + runbook links | Confirm abort thresholds, canary hold points, rollback drill ownership |
| Security | Security Reviewer | PENDING | Add dependency/security scan links | Confirm dependency audit + incident/secret handling checklist |
| Product/Protocol owner | Product/Protocol Owner | PENDING | Add decision thread/approval link | Confirm release scope, limitations, and deferred work acceptance |

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
