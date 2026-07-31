# Changelog

## 2026-07-31 - Release Candidate `v1.0.0-rc.1`

### Scope

- Finalized protocol-core production rollout controls and release documentation.
- Declared cross-repository contract/schema compatibility baseline.
- Added deterministic CI required-check candidates for production branch protection.
- Added staging HTTP-mode verification checklist and executable validation command.
- Added production cutover and rollback runbooks with explicit go/no-go and abort criteria.
- Added operations/security hardening artifacts and production readiness checklist.

### Known limitations

- Branch protection enforcement must still be configured in GitHub repository settings (`docs/branch-protection-required-settings.md`).
- Staging/production HTTP end-to-end verification against real providers requires environment-owned credentials and endpoints.
