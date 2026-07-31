# Rollback Runbook

## Trigger conditions

Start rollback immediately when any trigger is confirmed:

- Timeout abort threshold reached.
- Reconciliation lag abort threshold reached.
- Duplicate side effect/reward emission confirmed.
- Security control failure (webhook/authenticity/config drift) confirmed.

## Owners and decision authority

- Eng lead: executes code/config rollback.
- Ops lead: executes traffic rollback and runtime controls.
- Sec lead: coordinates security containment when trigger is security-related.

## Rollback actions

1. Declare rollback in `#protocol-core-release` with timestamp and trigger.
2. Freeze rollout expansion and return traffic to previous stable release.
3. Revert runtime mode controls to previous stable configuration.
4. Validate stabilization metrics:
   - timeout rate returns below warning threshold,
   - reconciliation backlog no longer grows,
   - no new duplicate side effects observed.
5. Capture incident timeline and impacted transaction/reference ranges.
6. Open incident using `docs/incident-response-template.md`.
7. Keep rollout blocked until root-cause remediation is approved by Eng/Ops/Sec.

## Post-rollback verification

- Re-run deterministic verification:

```bash
pnpm check && pnpm verify:staging:http
```

- Confirm required checks are green on rollback target.
- Confirm communication closure message with follow-up owner and ETA.
