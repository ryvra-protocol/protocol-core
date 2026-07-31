# Final Cutover Decision Record

Repository: `ryvra-protocol/protocol-core`  
Date: 2026-07-31

## Current verdict

**READY_PENDING_EVIDENCE**

## Blocking conditions

1. Attach immutable Actions/check links in `docs/cutover-evidence-index.md` for candidate SHA.
2. Complete role signoffs in `docs/release-candidate-signoff.md` (Core Eng, Ops/SRE, Security, Product/Protocol owner).
3. Execute operator-side open PR reconciliation/closure workflow with authenticated PR API access and record outcomes in `docs/pr-reconciliation-final-cutover.md`.
4. Confirm branch protection configuration is active on `main` per `docs/branch-protection-required-settings.md`.

## Next operator actions (ordered)

1. Run `pnpm release:rc:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` on release candidate commit.
2. Populate `docs/cutover-evidence-index.md` with required-check and staging artifact links.
3. Open a go/no-go issue using `.github/ISSUE_TEMPLATE/go-no-go-cutover.yml` and complete all required fields.
4. Execute PR reconciliation close/keep decisions and apply closures for superseded PRs.
5. Validate branch protection required checks and screenshot/field evidence.
6. Resolve remaining YELLOW/RED rows in `docs/cross-repo-cutover-tracker.md` or record approved risk acceptance.
7. Update this document verdict to `READY` only after all blockers are cleared.

## Rollback commander and on-call contacts (role-based)

- Rollback commander: Release Engineering Lead (role)
- Incident commander: Ops/SRE On-call Lead (role)
- Security escalation: Security Response Lead (role)
- Finance/settlement escalation: Ledger Operations Lead (role)
- Product decision authority: Product/Protocol Owner (role)
