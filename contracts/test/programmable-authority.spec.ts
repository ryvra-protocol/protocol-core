import test from "node:test";
import assert from "node:assert/strict";

import {
  ActorType,
  AuthorizationDecision,
  IntentAction,
  RiskDecision,
  isIdempotencyCorrelationConsistent,
  isProvenanceChainComplete,
  validateAuthorizationContext,
  validateAuthorizationMandateLinkage,
  validateExecutionContext,
  validateFinancialIntent,
  validateRiskContext
} from "../src/index.js";

test("validates required FinancialIntent fields and rejects missing policyVersion", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");

  const valid = {
    intentId: "intent-1",
    actorType: ActorType.USER,
    actorId: "user-1",
    action: IntentAction.PAY,
    assetId: "asset-usdc",
    purpose: "vendor invoice",
    policyVersion: "policy-v1",
    correlationId: "corr-1",
    idempotencyKey: "corr-1:req-1",
    expiresAt: "2026-01-01T00:10:00.000Z"
  };

  assert.equal(validateFinancialIntent(valid, now), true);
  assert.equal(validateFinancialIntent({ ...valid, policyVersion: "" }, now), false);
});

test("rejects expired FinancialIntent", () => {
  const now = new Date("2026-01-01T00:10:00.000Z");

  assert.equal(
    validateFinancialIntent(
      {
        intentId: "intent-2",
        actorType: ActorType.APPLICATION,
        actorId: "app-1",
        action: IntentAction.TRANSFER,
        assetId: "asset-usdc",
        purpose: "rebalance",
        policyVersion: "policy-v2",
        correlationId: "corr-2",
        idempotencyKey: "corr-2:req-1",
        expiresAt: "2026-01-01T00:09:59.000Z"
      },
      now
    ),
    false
  );
});

test("validates context required fields", () => {
  assert.equal(
    validateAuthorizationContext({
      authorizationId: "auth-1",
      intentId: "intent-1",
      mandateId: "mandate-1",
      policyVersion: "policy-v1",
      decision: AuthorizationDecision.APPROVED,
      reasonCode: "ALLOW_POLICY",
      approvedBy: { actorType: ActorType.SYSTEM, actorId: "system-approver" },
      approvedAt: "2026-01-01T00:00:05.000Z"
    }),
    true
  );

  assert.equal(
    validateRiskContext({
      riskAssessmentId: "risk-1",
      riskTier: "LOW",
      score: 0.05,
      factors: ["velocity_ok"],
      decision: RiskDecision.APPROVED,
      assessedAt: "2026-01-01T00:00:01.000Z"
    }),
    true
  );

  assert.equal(
    validateExecutionContext({
      intentId: "intent-1",
      actorId: "user-1",
      mandateId: "mandate-1",
      capabilityId: "cap-1",
      sessionKeyId: "sk-1",
      chainId: "eip155:1",
      targetContract: "0xabc",
      functionSelector: "0xa9059cbb",
      nonceDomain: "payments"
    }),
    true
  );
});

test("supports enum serialization and deserialization", () => {
  const serialized = JSON.stringify({ actorType: ActorType.AGENT, action: IntentAction.REBALANCE });
  const parsed = JSON.parse(serialized) as { actorType: ActorType; action: IntentAction };

  assert.equal(parsed.actorType, ActorType.AGENT);
  assert.equal(parsed.action, IntentAction.REBALANCE);
});

test("checks provenance chain completeness", () => {
  const provenance = {
    actorId: "user-1",
    mandateId: "mandate-1",
    policyVersion: "policy-v1",
    riskAssessmentId: "risk-1",
    intentId: "intent-1",
    authorizationId: "auth-1",
    capabilityId: "cap-1",
    sessionKeyId: "sk-1",
    userOpHash: "0x1",
    transactionId: "0x2",
    ledgerEventId: "led-1",
    settlementId: "set-1"
  };

  assert.equal(isProvenanceChainComplete(provenance), true);
  assert.equal(isProvenanceChainComplete({ ...provenance, settlementId: "" }), false);
});

test("checks idempotency key and correlationId consistency", () => {
  assert.equal(
    isIdempotencyCorrelationConsistent({
      correlationId: "corr-3",
      idempotencyKey: "corr-3:req-7"
    }),
    true
  );

  assert.equal(
    isIdempotencyCorrelationConsistent({
      correlationId: "corr-3",
      idempotencyKey: "other:req-7"
    }),
    false
  );
});

test("rejects authorization without mandate linkage", () => {
  assert.equal(
    validateAuthorizationMandateLinkage(
      { mandateId: "mandate-1" },
      { mandateId: "mandate-2" }
    ),
    false
  );

  assert.equal(
    validateAuthorizationMandateLinkage(
      { mandateId: undefined },
      { mandateId: "mandate-1" }
    ),
    false
  );
});
