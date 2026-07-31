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

Use the exact check names from `.github/workflows/ci.yml`:

- `Production CI / lint-docs`
- `Production CI / typecheck`
- `Production CI / tests`
- `Production CI / dependency-security`
- `Production CI / version-consistency`

## Verification commands and evidence expectations

```bash
git fetch origin main:refs/remotes/origin/main
git log --oneline --max-count=1 refs/remotes/origin/main
```

Expected evidence:

- PR UI shows all required checks green before merge.
- Branch protection panel lists the required checks above.
