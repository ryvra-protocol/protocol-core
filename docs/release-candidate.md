# Release Candidate Declaration

- Repository: `ryvra-protocol/protocol-core`
- Release candidate: `v1.0.0-rc.1`
- Date: 2026-07-31
- Baseline branch: `main`

## Included capabilities

- Canonical core contracts/interfaces remain in `contracts/`.
- Adapter boundaries and reliability controls remain isolated in `adapters/`.
- Integration sandbox deterministic verification remains in `integration-sandbox/`.
- Production rollout controls are added via:
  - `.github/workflows/ci.yml`
  - `docs/staging-http-mode-verification.md`
  - `docs/production-cutover-runbook.md`
  - `docs/rollback-runbook.md`
  - `docs/production-ready-checklist.md`
  - `docs/branch-protection-required-settings.md`

## Known limitations

- No provider-specific secrets or endpoint values are committed in-repo.
- Real HTTP-mode staging verification requires environment-specific variables documented in `docs/staging-http-mode-verification.md`.
- Branch protection is a GitHub setting and cannot be enforced by repository code alone.

## Candidate acceptance requirements

- CI required checks all pass on the candidate commit.
- Branch protection settings match `docs/branch-protection-required-settings.md`.
- Go/no-go criteria in `docs/production-cutover-runbook.md` are signed by Eng/Ops/Sec owners.
