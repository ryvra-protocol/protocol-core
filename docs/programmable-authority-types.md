# RFC-0005 Programmable Authority Canonical Types

This document defines additive, backward-compatible canonical types for programmable financial authority in `protocol-core`.

## Canonical model

- AI proposes intent
- Ryvra policy and mandate layers authorize
- deterministic infrastructure executes
- ledger records the transaction
- settlement proves completion

## Type inventory

- Identity and actor: `ActorType`, `AgentIdentity`
- Authority primitives: `Mandate`, `AgentCapability`
- Intent model: `FinancialIntent`, `IntentAction`
- Context models: `AuthorizationContext`, `RiskContext`, `ExecutionContext`
- Provenance and reservation: `Provenance`, `Reservation`
- Confidential compatibility: `ConfidentialIntent`, `ConfidentialExecution`

## Validation helpers

- `validateFinancialIntent`
- `validateAuthorizationContext`
- `validateRiskContext`
- `validateExecutionContext`
- `validateAuthorizationMandateLinkage`
- `isIdempotencyCorrelationConsistent`
- `isProvenanceChainComplete`

## Example: Financial intent

```ts
import { ActorType, IntentAction, type FinancialIntent } from "@ryvra/contracts";

const intent: FinancialIntent = {
  intentId: "intent-001",
  actorType: ActorType.USER,
  actorId: "user-123",
  action: IntentAction.PAY,
  assetId: "asset-usdc",
  amount: "2500000",
  purpose: "invoice settlement",
  mandateId: "mandate-ops-v3",
  policyVersion: "policy-v2026-09",
  correlationId: "corr-abc",
  idempotencyKey: "corr-abc:req-1",
  expiresAt: "2026-09-10T21:00:00.000Z"
};
```

## Example: authorization and execution context

```ts
import {
  ActorType,
  AuthorizationDecision,
  RiskDecision,
  type AuthorizationContext,
  type ExecutionContext,
  type RiskContext
} from "@ryvra/contracts";

const authorization: AuthorizationContext = {
  authorizationId: "auth-001",
  intentId: "intent-001",
  mandateId: "mandate-ops-v3",
  policyVersion: "policy-v2026-09",
  decision: AuthorizationDecision.APPROVED,
  reasonCode: "ALLOW_LIMITS_OK",
  approvedBy: { actorType: ActorType.SYSTEM, actorId: "policy-engine" },
  approvedAt: "2026-09-10T20:31:00.000Z"
};

const risk: RiskContext = {
  riskAssessmentId: "risk-001",
  riskTier: "LOW",
  score: 0.08,
  factors: ["velocity_ok", "counterparty_ok"],
  decision: RiskDecision.APPROVED,
  assessedAt: "2026-09-10T20:31:00.000Z"
};

const execution: ExecutionContext = {
  intentId: "intent-001",
  actorId: "user-123",
  mandateId: "mandate-ops-v3",
  capabilityId: "cap-erc20-transfer",
  sessionKeyId: "sk-001",
  chainId: "eip155:1",
  targetContract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  functionSelector: "0xa9059cbb",
  nonceDomain: "pay-v1"
};
```

## Example: provenance chain

```ts
import { isProvenanceChainComplete, type Provenance } from "@ryvra/contracts";

const provenance: Provenance = {
  actorId: "user-123",
  mandateId: "mandate-ops-v3",
  policyVersion: "policy-v2026-09",
  riskAssessmentId: "risk-001",
  intentId: "intent-001",
  authorizationId: "auth-001",
  capabilityId: "cap-erc20-transfer",
  sessionKeyId: "sk-001",
  userOpHash: "0xuserop",
  transactionId: "0xtx",
  ledgerEventId: "ledger-evt-1001",
  settlementId: "settlement-1001"
};

isProvenanceChainComplete(provenance); // true
```
