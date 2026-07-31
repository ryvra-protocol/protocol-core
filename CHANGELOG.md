# Changelog

## 2026-07-31 - Release Candidate `v1.0.0-rc.1`

### Scope

- Finalized protocol-core production rollout controls and release documentation.
- Declared cross-repository contract/schema compatibility baseline.
- Added deterministic CI required-check candidates for production branch protection.
- Added staging HTTP-mode verification checklist and executable validation command.
- Added production cutover and rollback runbooks with explicit go/no-go and abort criteria.
- Added operations/security hardening artifacts and production readiness checklist.
- Added final cutover governance artifacts:
  - PR reconciliation report
  - Go/No-Go issue template
  - Evidence index
  - Cross-repo cutover tracker
  - Final cutover decision record
- Added dry-run RC tag readiness validation script (`pnpm release:rc:check`).

### Known limitations

- Branch protection enforcement must still be configured in GitHub repository settings (`docs/branch-protection-required-settings.md`).
- Staging/production HTTP end-to-end verification against real providers requires environment-owned credentials and endpoints.
- Open-PR reconciliation close actions require operator token permissions for PR API operations.

### Deferred items

- Distributed dedupe/outbox persistence hardening remains targeted post-cutover (`docs/release-candidate-signoff.md`).
- Cross-repo downstream compatibility evidence links are pending final owner updates (`docs/cross-repo-cutover-tracker.md`).
