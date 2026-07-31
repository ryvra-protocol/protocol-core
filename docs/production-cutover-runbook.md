# Production Cutover Runbook

## Owners

- Engineering owner: Protocol Core Eng Lead
- Operations owner: On-call Ops Lead
- Security owner: Security Incident Commander

## Go/No-Go criteria

All must be true:

1. Required CI checks pass on target commit.
2. Branch protection settings for `main` match `docs/branch-protection-required-settings.md`.
3. `docs/staging-http-mode-verification.md` checklist completed with evidence attached.
4. `docs/production-ready-checklist.md` has no unresolved TODO in critical categories.
5. Eng/Ops/Sec sign-offs recorded in release channel.

## Abort thresholds during cutover

Abort and roll back if any condition is met:

- Adapter timeout rate >= 5% for 5 continuous minutes.
- Reconciliation lag >= 300s sustained across 3 checks.
- Confirmed duplicate financial side effect or duplicate reward emission.
- Webhook authenticity failures indicate signature/config drift.

## Communication plan

- Channel: `#protocol-core-release`
- Required participants: Eng Lead, Ops Lead, Sec Lead, Finance Ops liaison.
- Required messages:
  1. T-30m readiness check start.
  2. T-0 cutover start + commit SHA.
  3. Hold-point outcomes (5%, 25%, 50%, 100%).
  4. Go-live completion or rollback declaration.

## Cutover procedure

1. Confirm target commit SHA and tag candidate (`v1.0.0-rc.1` lineage).
2. Confirm all required checks green on `main`.
3. Confirm branch protection and environment configs are unchanged since approval.
4. Start 5% canary.
5. Observe for 30 minutes:
   - timeout rate,
   - duplicate replay metrics,
   - reconciliation lag,
   - webhook verification failures.
6. If stable, expand to 25%, then 50% after second hold point, then 100%.
7. At each hold point, post explicit go/no-go decision with metrics snapshot.
8. On final success, publish completion message and archive evidence bundle.
