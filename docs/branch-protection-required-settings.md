# Branch Protection Required Settings (`main`)

Branch protection must be configured in GitHub UI because it is not fully enforceable in repository code.

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

1. Open GitHub settings:
   - Repository -> **Settings** -> **Branches** -> `main` branch protection rule.
2. Confirm fields:
   - **Require a pull request before merging** = enabled
   - **Require status checks to pass before merging** = enabled
   - **Require branches to be up to date before merging** = enabled
   - Required checks list includes the five names above.
3. Open a recent PR to `main` and verify:
   - Check suite shows the same check names.
   - Merge remains blocked until all required checks are green.
4. Capture evidence:
   - Screenshot of branch protection rule check list.
   - Screenshot of PR checks panel for a passing candidate.

## Fallback steps if check names changed

1. Open `.github/workflows/ci.yml` and confirm current job names under `jobs.*.name`.
2. Update the branch protection required-check list to match job names exactly.
3. Re-run a PR and verify checks appear with the updated names.
4. Update this document with the new names and screenshot evidence.
