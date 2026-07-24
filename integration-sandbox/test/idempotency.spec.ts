import test from "node:test";
import assert from "node:assert/strict";

import { account, asset, createSandboxContext, idempotency, reference } from "../src/context.js";
import { runHappyPathPayment } from "../src/flows/happy-path-payment.js";
import { runIdempotentRetry } from "../src/flows/idempotent-retry.js";

test("idempotent replay does not duplicate postings and emits duplicate reason code", () => {
  const context = createSandboxContext();
  const input = {
    context,
    payer: account("acct_retry_payer"),
    payee: account("acct_retry_payee"),
    asset_id: asset("asset_USDC"),
    amount_minor: 700,
    reference_id: reference("ref_retry"),
    idempotency_key: idempotency("idem_retry"),
    risk_score: 20
  };

  runHappyPathPayment(input);
  const beforeLedgerCount = context.ledgerByReference.size;
  const beforeContributionCount = context.contributionsByReference.size;

  const replay = runIdempotentRetry(context, input);

  assert.equal(replay.result.duplicate_detected, true);
  assert.equal(context.ledgerByReference.size, beforeLedgerCount);
  assert.equal(context.contributionsByReference.size, beforeContributionCount);
  const duplicateEvent = context.events.find((event) => event.event_type === "idempotency.duplicate_detected");
  assert.ok(duplicateEvent);
  assert.deepEqual((duplicateEvent!.payload as { reason_codes: string[] }).reason_codes, ["DUPLICATE_REFERENCE_REPLAY"]);
  assert.equal("contribution_id" in (duplicateEvent!.payload as Record<string, unknown>), false);
});
