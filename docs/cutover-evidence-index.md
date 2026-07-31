# Cutover Evidence Index

Repository: `ryvra-protocol/protocol-core`  
RC candidate: `v1.0.0-rc.1`

## 1) CI required checks links

- `lint-docs`: `<ACTIONS_RUN_URL_OR_CHECK_URL>`
- `version-consistency`: `<ACTIONS_RUN_URL_OR_CHECK_URL>`
- `typecheck`: `<ACTIONS_RUN_URL_OR_CHECK_URL>`
- `tests`: `<ACTIONS_RUN_URL_OR_CHECK_URL>`
- `dependency-security`: `<ACTIONS_RUN_URL_OR_CHECK_URL>`

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

## Link capture instructions

1. Open the Actions run on the candidate commit.
2. Copy job URLs for each required check.
3. Download/upload artifact links and paste immutable URLs here.
4. Cross-link this file in the go/no-go issue and `docs/final-cutover-decision.md`.
