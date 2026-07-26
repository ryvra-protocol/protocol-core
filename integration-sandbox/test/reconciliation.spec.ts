import test from "node:test";
import assert from "node:assert/strict";

import { account, asset, createSandboxContext, idempotency, reference } from "../src/context.js";
import { runHappyPathPayment } from "../src/flows/happy-path-payment.js";
import { runIdempotentRetry } from "../src/flows/idempotent-retry.js";
import { buildReconciliationReport } from "../src/flows/reconciliation-report.js";

test("reconciliation report totals and unreconciled handling are deterministic", async () => {
  const context = createSandboxContext();

  await runHappyPathPayment({
    context,
    payer: account("acct_r1"),
    payee: account("acct_r2"),
    asset_id: asset("asset_USDC"),
    amount_minor: 400,
    reference_id: reference("ref_report_allow"),
    idempotency_key: idempotency("idem_report_allow"),
    risk_score: 5
  });

  await runHappyPathPayment({
    context,
    payer: account("acct_r3"),
    payee: account("acct_r4"),
    asset_id: asset("asset_BLOCKED"),
    amount_minor: 900,
    reference_id: reference("ref_report_deny"),
    idempotency_key: idempotency("idem_report_deny"),
    risk_score: 90
  });

  await runIdempotentRetry(context, {
    context,
    payer: account("acct_r1"),
    payee: account("acct_r2"),
    asset_id: asset("asset_USDC"),
    amount_minor: 400,
    reference_id: reference("ref_report_allow"),
    idempotency_key: idempotency("idem_report_allow"),
    risk_score: 5
  });

  const report = buildReconciliationReport(context);
  assert.deepEqual(report, {
    total_intents: 2,
    allowed_count: 1,
    denied_count: 1,
    finalized_count: 0,
    reconciled_count: 1,
    failed_transitions_count: 1,
    duplicate_attempt_count: 1,
    unreconciled_items: []
  });
});
