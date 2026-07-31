# Staging HTTP-Mode Verification

## Objective

Provide executable, evidence-driven verification for production-like HTTP behavior without embedding secrets in the repository.

## Execution modes

### Mode A (in-repo deterministic HTTP simulation)

Run:

```bash
pnpm verify:staging:http
```

Expected evidence:

- command exits `0`.
- test output includes pass results for adapter HTTP/retry/idempotency specs and integration reliability/reconciliation specs.

### Mode B (real staging endpoints; optional)

Use only in secure CI/runtime environment with secrets injected externally.

Environment variable contract (minimum):

- `PAY_MODE=http`
- `POLICY_RISK_MODE=http`
- `LEDGER_SETTLEMENT_MODE=http`
- `PAY_BASE_URL`, `POLICY_RISK_BASE_URL`, `LEDGER_SETTLEMENT_BASE_URL`
- `PAY_TIMEOUT_MS`, `POLICY_RISK_TIMEOUT_MS`, `LEDGER_SETTLEMENT_TIMEOUT_MS`
- `PAY_RETRY_ATTEMPTS`, `POLICY_RISK_RETRY_ATTEMPTS`, `LEDGER_SETTLEMENT_RETRY_ATTEMPTS`
- `PAY_WEBHOOK_SECRET` (required when webhook verification is enabled)

Expected evidence:

- artifact bundle with sanitized logs + metrics snapshots + reconciliation report.
- no secrets printed in command output.

## Executable checklist

- [ ] Timeout + retry behavior
  - Evidence targets:
    - `adapters/pay/test/retry.spec.ts`
    - `adapters/policy-risk/test/retry.spec.ts`
    - `adapters/ledger-settlement/test/retry.spec.ts`
  - Pass expectation: retries are bounded, timeout errors are typed, no unbounded loops.

- [ ] Duplicate callback replay safety
  - Evidence targets:
    - `integration-sandbox/test/pay-reliability.spec.ts`
    - `adapters/pay/test/idempotency.spec.ts`
  - Pass expectation: duplicate callbacks/replays do not create duplicate side effects.

- [ ] Late callback ordering (no terminal-state regression)
  - Evidence targets:
    - `integration-sandbox/test/pay-reliability.spec.ts`
    - `adapters/pay/test/state-machine.spec.ts`
  - Pass expectation: stale/late callbacks are ignored once terminal success is recorded.

- [ ] Reconciliation correctness
  - Evidence targets:
    - `integration-sandbox/test/reconciliation.spec.ts`
  - Pass expectation: deterministic reconciliation schema/counts and stable unreconciled reporting.

## Evidence retention

- Store command logs and summary outcome in release artifacts.
- Attach reconciliation sample output and incident channel link for go/no-go review.
