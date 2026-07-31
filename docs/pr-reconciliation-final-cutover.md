# PR Reconciliation Report - Final Cutover

Date: 2026-07-31  
Repository: `ryvra-protocol/protocol-core`  
Baseline branch: `main` (`de5f049`)

## Baseline verification

- `origin/main` fetched and inspected locally.
- Latest merge on `main`: `de5f049` (`Merge pull request #16 from ryvra-protocol/post-implementation-production-rollout`).
- This merge is treated as the rollout-hardening baseline for final cutover operations.

## Open PR reconciliation result

### Discovery evidence

- GitHub API/CLI open-PR enumeration is blocked in this execution environment (GraphQL 403 / DNS proxy).
- Local remote branch inventory shows only `main` and the current working branch.
- Historical pull refs (`refs/pull/*/head`) were inspected for ancestry overlap checks, but open/closed state could not be retrieved without PR API access.

### Open PR decision table

At reconciliation time, **no open PR metadata could be retrieved programmatically with current token/network constraints**. Use the operator workflow below to enumerate open PRs and apply close decisions.

| PR # | Title | Status | Evidence summary | Risk if closed |
| --- | --- | --- | --- | --- |
| TBD (from operator query) | TBD | KEEP_OPEN or CLOSE_SUPERSEDED | Populate with merge-base/effective-diff evidence from procedure below | Populate with impacted scope and owner confirmation |

## Operator procedure (exact)

Run with a token that has `repo` read/write permissions:

1. Enumerate open PRs:
   - `gh pr list -R ryvra-protocol/protocol-core --state open --limit 100 --json number,title,headRefName,baseRefName,url`
2. For each open PR head branch `H` against `main`:
   - `git fetch origin main:refs/remotes/origin/main`
   - `git fetch origin H:refs/remotes/origin/H`
   - `git merge-base refs/remotes/origin/main refs/remotes/origin/H`
   - `git rev-list --left-right --count refs/remotes/origin/main...refs/remotes/origin/H`
   - `git diff --name-status refs/remotes/origin/main...refs/remotes/origin/H`
3. Decision logic:
   - `CLOSE_SUPERSEDED` when head is fully contained by main or effective diff is empty/duplicative.
   - `KEEP_OPEN` when net-new commits/files remain and owner confirms relevance.

## Manual close steps (if superseded)

For each superseded PR:

1. Comment with evidence:
   - merge-base SHA
   - left/right commit counts
   - effective diff summary
   - overlapping merged commit references
2. Close PR:
   - `gh pr close <PR_NUMBER> -R ryvra-protocol/protocol-core --comment "Superseded by commits already merged to main; evidence: <summary>."`
3. Capture closure evidence:
   - PR URL
   - final comment permalink
   - timestamp and operator handle

## Evidence bundle pointers

- Baseline main commit: `de5f049`
- Local branch inventory command: `git ls-remote --heads origin`
- Pull ref inventory command: `git ls-remote origin 'refs/pull/*/head'`
