export enum ActorType {
  USER = "USER",
  APPLICATION = "APPLICATION",
  SYSTEM = "SYSTEM",
  AGENT = "AGENT"
}

export enum AgentStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  REVOKED = "REVOKED"
}

export interface AgentIdentity {
  agentId: string;
  ownerId: string;
  model: string;
  status: AgentStatus;
  createdAt: string;
}

export interface Mandate {
  mandateId: string;
  actorId: string;
  version: string;
  scope: string[];
  limits: Record<string, number | string | boolean>;
  policyVersion: string;
  expiresAt: string;
  mandateHash: string;
}

export interface AgentCapability {
  capabilityId: string;
  mandateId: string;
  allowedActions: IntentAction[];
  assets: string[];
  chains: string[];
  contracts: string[];
  functionSelectors: string[];
  limits: Record<string, number | string | boolean>;
  expiresAt: string;
  nonceDomain: string;
  capabilityHash?: string;
}

export enum IntentAction {
  PAY = "PAY",
  TRANSFER = "TRANSFER",
  SWAP = "SWAP",
  TRADE = "TRADE",
  REBALANCE = "REBALANCE",
  COLLECT = "COLLECT",
  OPEN_POSITION = "OPEN_POSITION",
  CLOSE_POSITION = "CLOSE_POSITION"
}

export interface FinancialIntent {
  intentId: string;
  actorType: ActorType;
  actorId: string;
  action: IntentAction;
  assetId: string;
  amount?: string;
  chainId?: string;
  recipient?: string;
  venue?: string;
  purpose: string;
  mandateId?: string;
  policyVersion: string;
  correlationId: string;
  idempotencyKey: string;
  expiresAt: string;
  intentHash?: string;
}

export enum AuthorizationDecision {
  APPROVED = "APPROVED",
  DENIED = "DENIED",
  REVIEW = "REVIEW"
}

export type NonAgentActorType = Exclude<ActorType, ActorType.AGENT>;

export interface AuthorizationApproval {
  actorType: NonAgentActorType;
  actorId: string;
}

export interface AuthorizationContext {
  authorizationId: string;
  intentId: string;
  mandateId: string;
  policyVersion: string;
  decision: AuthorizationDecision;
  reasonCode: string;
  approvedBy: AuthorizationApproval;
  approvedAt: string;
  authorizationHash?: string;
}

export enum RiskDecision {
  APPROVED = "APPROVED",
  REVIEW = "REVIEW",
  DENIED = "DENIED"
}

export interface RiskContext {
  riskAssessmentId: string;
  riskTier: string;
  score: number;
  factors: string[];
  decision: RiskDecision;
  assessedAt: string;
  riskHash?: string;
}

export interface ExecutionContext {
  intentId: string;
  actorId: string;
  mandateId: string;
  capabilityId: string;
  sessionKeyId: string;
  chainId: string;
  targetContract: string;
  functionSelector: string;
  nonceDomain: string;
  executionHash?: string;
}

export interface Provenance {
  actorId: string;
  mandateId: string;
  policyVersion: string;
  riskAssessmentId: string;
  intentId: string;
  authorizationId: string;
  capabilityId: string;
  sessionKeyId: string;
  userOpHash: string;
  transactionId: string;
  ledgerEventId: string;
  settlementId: string;
  provenanceHash?: string;
}

export enum ReservationStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  RELEASED = "RELEASED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED"
}

export interface Reservation {
  reservationId: string;
  accountId: string;
  assetId: string;
  amount: string;
  intentId: string;
  status: ReservationStatus;
  expiresAt: string;
  concurrencyToken: string;
  reservationHash?: string;
}

export interface ConfidentialIntent {
  intentId: string;
  encryptedPayloadRef?: string;
  encryptedPayloadBytes?: string;
  commitmentHash: string;
  provider: string;
}

export interface ConfidentialExecution {
  executionId: string;
  proofRef: string;
  decryptAuthorizationRef: string;
  resultCommitment: string;
}

export const FINANCIAL_INTENT_FIELDS = [
  "intentId",
  "actorType",
  "actorId",
  "action",
  "assetId",
  "amount",
  "chainId",
  "recipient",
  "venue",
  "purpose",
  "mandateId",
  "policyVersion",
  "correlationId",
  "idempotencyKey",
  "expiresAt",
  "intentHash"
] as const;

export const AUTHORIZATION_CONTEXT_FIELDS = [
  "authorizationId",
  "intentId",
  "mandateId",
  "policyVersion",
  "decision",
  "reasonCode",
  "approvedBy",
  "approvedAt",
  "authorizationHash"
] as const;

export const RISK_CONTEXT_FIELDS = [
  "riskAssessmentId",
  "riskTier",
  "score",
  "factors",
  "decision",
  "assessedAt",
  "riskHash"
] as const;

export const EXECUTION_CONTEXT_FIELDS = [
  "intentId",
  "actorId",
  "mandateId",
  "capabilityId",
  "sessionKeyId",
  "chainId",
  "targetContract",
  "functionSelector",
  "nonceDomain",
  "executionHash"
] as const;

const hasNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const isFutureTimestamp = (value: unknown, now: Date): boolean => {
  if (!hasNonEmptyString(value)) {
    return false;
  }

  const ts = Date.parse(value);
  return Number.isFinite(ts) && ts > now.getTime();
};

const includesEnumValue = <T extends string>(values: readonly T[], value: unknown): value is T =>
  hasNonEmptyString(value) && values.includes(value as T);

export const isIdempotencyCorrelationConsistent = (input: {
  correlationId: string;
  idempotencyKey: string;
}): boolean => {
  if (!hasNonEmptyString(input.correlationId) || !hasNonEmptyString(input.idempotencyKey)) {
    return false;
  }

  return input.idempotencyKey.startsWith(`${input.correlationId}:`);
};

export const validateFinancialIntent = (
  intent: Partial<FinancialIntent>,
  now: Date = new Date()
): intent is FinancialIntent => {
  if (
    !hasNonEmptyString(intent.intentId) ||
    !includesEnumValue(Object.values(ActorType), intent.actorType) ||
    !hasNonEmptyString(intent.actorId) ||
    !includesEnumValue(Object.values(IntentAction), intent.action) ||
    !hasNonEmptyString(intent.assetId) ||
    !hasNonEmptyString(intent.purpose) ||
    !hasNonEmptyString(intent.policyVersion) ||
    !hasNonEmptyString(intent.correlationId) ||
    !hasNonEmptyString(intent.idempotencyKey)
  ) {
    return false;
  }

  if (!isFutureTimestamp(intent.expiresAt, now)) {
    return false;
  }

  return isIdempotencyCorrelationConsistent({
    correlationId: intent.correlationId,
    idempotencyKey: intent.idempotencyKey
  });
};

export const validateAuthorizationContext = (
  context: Partial<AuthorizationContext>
): context is AuthorizationContext => {
  return (
    hasNonEmptyString(context.authorizationId) &&
    hasNonEmptyString(context.intentId) &&
    hasNonEmptyString(context.mandateId) &&
    hasNonEmptyString(context.policyVersion) &&
    includesEnumValue(Object.values(AuthorizationDecision), context.decision) &&
    hasNonEmptyString(context.reasonCode) &&
    typeof context.approvedBy === "object" &&
    context.approvedBy !== null &&
    includesEnumValue(Object.values(ActorType).filter((type) => type !== ActorType.AGENT), (context.approvedBy as AuthorizationApproval).actorType) &&
    hasNonEmptyString((context.approvedBy as AuthorizationApproval).actorId) &&
    hasNonEmptyString(context.approvedAt)
  );
};

export const validateRiskContext = (context: Partial<RiskContext>): context is RiskContext => {
  return (
    hasNonEmptyString(context.riskAssessmentId) &&
    hasNonEmptyString(context.riskTier) &&
    typeof context.score === "number" &&
    Number.isFinite(context.score) &&
    Array.isArray(context.factors) &&
    context.factors.length > 0 &&
    context.factors.every((factor) => hasNonEmptyString(factor)) &&
    includesEnumValue(Object.values(RiskDecision), context.decision) &&
    hasNonEmptyString(context.assessedAt)
  );
};

export const validateExecutionContext = (context: Partial<ExecutionContext>): context is ExecutionContext => {
  return (
    hasNonEmptyString(context.intentId) &&
    hasNonEmptyString(context.actorId) &&
    hasNonEmptyString(context.mandateId) &&
    hasNonEmptyString(context.capabilityId) &&
    hasNonEmptyString(context.sessionKeyId) &&
    hasNonEmptyString(context.chainId) &&
    hasNonEmptyString(context.targetContract) &&
    hasNonEmptyString(context.functionSelector) &&
    hasNonEmptyString(context.nonceDomain)
  );
};

export const isProvenanceChainComplete = (provenance: Partial<Provenance>): provenance is Provenance => {
  return (
    hasNonEmptyString(provenance.actorId) &&
    hasNonEmptyString(provenance.mandateId) &&
    hasNonEmptyString(provenance.policyVersion) &&
    hasNonEmptyString(provenance.riskAssessmentId) &&
    hasNonEmptyString(provenance.intentId) &&
    hasNonEmptyString(provenance.authorizationId) &&
    hasNonEmptyString(provenance.capabilityId) &&
    hasNonEmptyString(provenance.sessionKeyId) &&
    hasNonEmptyString(provenance.userOpHash) &&
    hasNonEmptyString(provenance.transactionId) &&
    hasNonEmptyString(provenance.ledgerEventId) &&
    hasNonEmptyString(provenance.settlementId)
  );
};

export const validateAuthorizationMandateLinkage = (
  intent: Pick<FinancialIntent, "mandateId">,
  authorization: Pick<AuthorizationContext, "mandateId">
): boolean => hasNonEmptyString(intent.mandateId) && intent.mandateId === authorization.mandateId;
