# Cutover Evidence Index

Repository: `ryvra-protocol/protocol-core`  
RC candidate: `v1.0.0-rc.1`
Candidate commit SHA: `e502f6558c803169f3875ef3e3cc9c2fc2b1c472` (`origin/main`, verified 2026-07-31T19:14:31Z)

## 0) Local final execution pass results (current `main`)

| Check | Start (UTC) | End (UTC) | Result |
| --- | --- | --- | --- |
| `pnpm install --frozen-lockfile` | 2026-07-31T19:14:53Z | 2026-07-31T19:14:54Z | PASS |
| `pnpm release:rc:check` | 2026-07-31T19:14:54Z | 2026-07-31T19:14:54Z | PASS |
| `pnpm lint` | 2026-07-31T19:14:54Z | 2026-07-31T19:14:55Z | PASS |
| `pnpm typecheck` | 2026-07-31T19:14:55Z | 2026-07-31T19:15:09Z | PASS |
| `pnpm test` | 2026-07-31T19:15:09Z | 2026-07-31T19:15:25Z | PASS |

Execution note:

- Earlier attempt failed because `pnpm` shim was unavailable in PATH; corrected by running `corepack enable`, then re-running all required commands above on the same candidate SHA.

## 1) CI required checks links

- Branch protection required-check verification (`main`): https://github.com/ryvra-protocol/protocol-core/settings/rules/insights (COMPLETE)
- `lint-docs`: verified in branch protection required checks (COMPLETE)
- `version-consistency`: verified in branch protection required checks (COMPLETE)
- `typecheck`: verified in branch protection required checks (COMPLETE)
- `tests`: verified in branch protection required checks (COMPLETE)
- `dependency-security`: verified in branch protection required checks (COMPLETE)

Operator note: use the run that executed on the exact release candidate commit SHA.

## 2) Staging HTTP verification artifacts

- Staging workflow run: `<ACTIONS_RUN_URL>`
- Artifact bundle (logs/reports): `<ARTIFACT_URL>`
- Summary record: `docs/staging-http-mode-verification.md`
- Additional gate reference: `docs/staging-readiness-gate-report.md`

Operator note: include immutable run URLs and artifact IDs.

## 3) Callback replay/ordering test evidence

- Test file: `integration-sandbox/test/pay-reliability.spec.ts`
- CI job link for replay/ordering assertions: `<CHECK_URL_OR_LOG_LINK>`
- Any staging callback replay logs: `<LOG_LINK>`

## 4) Reconciliation evidence

- Test file: `integration-sandbox/test/reconciliation.spec.ts`
- Reconciliation gate report: `docs/staging-readiness-gate-report.md`
- Runtime reconciliation artifact/log bundle: `<ARTIFACT_OR_DASHBOARD_LINK>`

## 5) Security/dependency scan evidence

- CI dependency audit check: `<CHECK_URL>`
- Additional dependency review output (if run): `<LINK>`
- Incident/response policy reference: `SECURITY.md`

## 6) Formal go/no-go evidence

- Go/no-go issue URL: `<GO_NO_GO_ISSUE_URL>` (MISSING)
- Final decision comment permalink (must state `GO`): `<GO_DECISION_PERMALINK>` (MISSING)
- Signoff matrix source: `docs/release-candidate-signoff.md` (currently all `PENDING`)

## 7) RC tag cut artifacts

- Annotated RC tag command output (`v1.0.0-rc.1` -> `e502f6558c803169f3875ef3e3cc9c2fc2b1c472`): `<TAG_COMMAND_LOG_OR_TERMINAL_CAPTURE>` (MISSING)
- Remote tag URL: `<TAG_URL>` (MISSING)
- Release/tarball evidence (if generated): `<RELEASE_OR_ASSET_LINK>` (MISSING)

## Link capture instructions

1. Open the Actions run on the candidate commit.
2. Copy job URLs for each required check.
3. Download/upload artifact links and paste immutable URLs here.
4. Cross-link this file in the go/no-go issue and `docs/final-cutover-decision.md`.

## Operator commands to resolve missing links

1. Required checks on candidate SHA:
   - `gh run list -R ryvra-protocol/protocol-core --workflow "Production CI" --commit e502f6558c803169f3875ef3e3cc9c2fc2b1c472 --limit 20`
   - `gh run view <RUN_ID> -R ryvra-protocol/protocol-core --json jobs,url`
2. Dependency-security direct job URL:
   - Open `jobs[]` entry with `name=="dependency-security"` and paste its `html_url`.
3. GO/no-go issue:
   - Create from `.github/ISSUE_TEMPLATE/go-no-go-cutover.yml`, complete all required fields, and paste issue/comment permalinks above.
4. RC tag cut:
   - `git fetch origin main:refs/remotes/origin/main`
   - `git tag -a v1.0.0-rc.1 e502f6558c803169f3875ef3e3cc9c2fc2b1c472 -m "Release candidate v1.0.0-rc.1"`
   - `git push origin v1.0.0-rc.1`
   - Paste command capture and resulting tag URL.
