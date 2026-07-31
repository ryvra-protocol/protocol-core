# Branch Protection Required Settings (`main`)

Branch protection must be configured in GitHub UI because it is not fully enforceable in repository code.
This is the final expected configuration for cutover readiness.

## Exact GitHub settings to apply

Target branch: `main`

1. Require a pull request before merging: **enabled**
2. Require approvals: **at least 1**
3. Dismiss stale pull request approvals when new commits are pushed: **enabled**
4. Require status checks to pass before merging: **enabled**
5. Require branches to be up to date before merging: **enabled**
6. Restrict force pushes: **enabled**
7. Restrict deletions: **enabled**
8. Require conversation resolution before merging: **enabled**

## Required status checks

Configure these exact required check names:

- `lint-docs`
- `version-consistency`
- `typecheck`
- `tests`
- `dependency-security`

UI note: GitHub may display workflow-prefixed forms such as `Production CI / lint-docs`; select the check entries that map to the exact names above.

## Verification procedure

1. Programmatic check (preferred when token access is available):
   - `gh api repos/ryvra-protocol/protocol-core/branches/main/protection`
   - Verify JSON includes:
     - `required_pull_request_reviews.required_approving_review_count >= 1`
     - `required_status_checks.strict == true`
     - required checks include exactly:
       - `lint-docs`
       - `version-consistency`
       - `typecheck`
       - `tests`
       - `dependency-security`
2. UI fallback (required when API is unavailable):
   - Repository -> **Settings** -> **Branches** -> `main` branch protection rule.
   - Confirm all fields in the “Exact GitHub settings to apply” section are enabled.
   - Confirm required checks list includes the five names above.
3. PR behavior validation:
   - Open a recent PR targeting `main`.
   - Confirm merge is blocked until all five required checks are green.
   - Confirm check suite labels map to these names (with or without workflow prefix).
4. Evidence capture:
   - Screenshot of branch protection rule configuration.
   - Screenshot of PR checks panel on candidate SHA.
   - Optional: JSON response snippet from `gh api` output.

## Mismatch handling instructions

1. If required checks differ from this document:
   - Open `.github/workflows/ci.yml` and verify current `jobs.*.name` values.
   - Update GitHub branch protection required checks to the exact workflow job names.
2. If GitHub shows prefixed names only (for example `Production CI / lint-docs`):
   - Select the prefixed entries that map to the five canonical names above.
3. If one of the five required checks is absent from PR checks:
   - Re-run the workflow on a PR targeting `main`.
   - Confirm job exists/enabled in `.github/workflows/ci.yml`.
   - Resolve workflow/config error before approving cutover.
4. If API verification is blocked in execution environment:
   - Record `API_UNAVAILABLE` in evidence notes.
   - Complete the UI verification and screenshot capture steps.
5. Do not mark final cutover `READY` until mismatches are resolved and evidence links are attached in `docs/cutover-evidence-index.md`.
