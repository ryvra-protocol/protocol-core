# Final Cutover Decision Record

Repository: `ryvra-protocol/protocol-core`  
Date: 2026-07-31
Candidate SHA: `e502f6558c803169f3875ef3e3cc9c2fc2b1c472` (`origin/main`)

## Current verdict

READY_PENDING_EVIDENCE

## Go/No-Go status

NO-GO (pending required evidence and signoffs)

## Completed verification evidence

- `pnpm install --frozen-lockfile`: PASS (2026-07-31T19:14:53Z -> 2026-07-31T19:14:54Z)
- `pnpm release:rc:check`: PASS (2026-07-31T19:14:54Z -> 2026-07-31T19:14:54Z)
- `pnpm lint`: PASS (2026-07-31T19:14:54Z -> 2026-07-31T19:14:55Z)
- `pnpm typecheck`: PASS (2026-07-31T19:14:55Z -> 2026-07-31T19:15:09Z)
- `pnpm test`: PASS (2026-07-31T19:15:09Z -> 2026-07-31T19:15:25Z)
- Evidence index updated: `docs/cutover-evidence-index.md`

## Blocking conditions

1. Immutable GitHub Actions/check URLs are still missing for required checks (`lint-docs`, `version-consistency`, `typecheck`, `tests`, `dependency-security`) in `docs/cutover-evidence-index.md`.
2. Formal go/no-go issue and explicit final `GO` decision permalink are missing in `docs/cutover-evidence-index.md`.
3. Role signoffs in `docs/release-candidate-signoff.md` remain `PENDING` for Core Eng, Ops/SRE, Security, and Product/Protocol owner.
4. Operator-side open PR reconciliation/closure execution is still required; decision outcomes and closure evidence are not yet populated in `docs/pr-reconciliation-final-cutover.md`.
5. Branch protection on `main` cannot be confirmed from repository-only context; operator evidence (API/UI verification + screenshots) is still required per `docs/branch-protection-required-settings.md`.
6. RC tag cut artifacts (tag creation output, tag URL, release asset links if used) are missing from `docs/cutover-evidence-index.md`.

## Next operator actions (ordered)

1. Collect and paste immutable required-check links for candidate SHA into `docs/cutover-evidence-index.md`.
2. Create/complete go-no-go issue from `.github/ISSUE_TEMPLATE/go-no-go-cutover.yml` and add final `GO` decision permalink.
3. Complete signoffs in `docs/release-candidate-signoff.md` (all four owner roles).
4. Execute open PR reconciliation workflow and fill decision table + closure evidence in `docs/pr-reconciliation-final-cutover.md`.
5. Verify branch protection settings on `main` (API or UI path), capture screenshots, and attach references in evidence docs.
6. Cut/push `v1.0.0-rc.1` tag from candidate SHA and attach tag evidence links.
7. Re-check blocker list; set verdict to `READY` only when all evidence is present and go/no-go is `GO`.

## Rollback commander and on-call contacts (role-based)

- Rollback commander: Release Engineering Lead (role)
- Incident commander: Ops/SRE On-call Lead (role)
- Security escalation: Security Response Lead (role)
- Finance/settlement escalation: Ledger Operations Lead (role)
- Product decision authority: Product/Protocol Owner (role)
