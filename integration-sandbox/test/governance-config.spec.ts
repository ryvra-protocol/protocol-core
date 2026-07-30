import test from "node:test";
import assert from "node:assert/strict";

import { PolicyDecision } from "@ryvra/contracts";

import { account, asset, createSandboxContext, idempotency, reference } from "../src/context.js";
import { runHappyPathPayment } from "../src/flows/happy-path-payment.js";

test("policy-risk deterministic thresholds can be overridden via governance config env", async () => {
  const context = createSandboxContext({
    env: {
      POLICY_RISK_MAX_ALLOWED_AMOUNT_MINOR: "50"
    }
  });

  const { result } = await runHappyPathPayment({
    context,
    payer: account("acct_alice"),
    payee: account("acct_bob"),
    asset_id: asset("asset_USDC"),
    amount_minor: 100,
    reference_id: reference("ref_governance_policy_threshold"),
    idempotency_key: idempotency("idem_governance_policy_threshold"),
    risk_score: 10
  });

  assert.equal(result.decision.decision, PolicyDecision.DENY);
  assert.ok(result.decision.reason_codes.includes("LIMIT_EXCEEDED_AMOUNT_MINOR"));
});

test("PoT scoring configuration can be overridden via governance config env", async () => {
  const context = createSandboxContext({
    env: {
      POT_CONTRIBUTION_WEIGHT: "3",
      POT_SCORING_POLICY: "pot-weight-v2-governance-config"
    }
  });

  const { result } = await runHappyPathPayment({
    context,
    payer: account("acct_alice"),
    payee: account("acct_bob"),
    asset_id: asset("asset_USDC"),
    amount_minor: 100,
    reference_id: reference("ref_governance_pot_scoring"),
    idempotency_key: idempotency("idem_governance_pot_scoring"),
    risk_score: 10
  });

  assert.ok(result.contribution_event);
  assert.equal(result.contribution_event!.points_awarded, 300);
  assert.equal(result.contribution_event!.scoring_policy, "pot-weight-v2-governance-config");
});
