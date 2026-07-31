# Dependency Update and Security Policy

## Policy

- All dependency updates must use `pnpm` and update `pnpm-lock.yaml`.
- Direct dependency additions/updates require security review.
- High/Critical vulnerabilities must be triaged before merge.

## Update cadence

- Weekly: dependency audit and patch/minor review.
- Monthly: broader update window with compatibility validation.
- Emergency: out-of-band patch for active exploit or critical advisory.

## Required validation for dependency changes

1. Run deterministic install:

```bash
pnpm install --frozen-lockfile
```

1. Run security/dependency check:

```bash
pnpm audit --audit-level high
```

1. Run full verification suite:

```bash
pnpm check
```

## Triage SLA

- Critical: acknowledge within 24h, mitigation plan within 48h.
- High: acknowledge within 48h, mitigation plan within 5 business days.
- Medium/Low: triage in next scheduled dependency review cycle.
