import type {
  AccountId,
  AssetId,
  ContributionEvent,
  CorrelationId,
  EventEnvelope,
  IdempotencyKey,
  LedgerEventId,
  LedgerTransaction,
  PaymentIntent,
  PolicyDecisionOutput,
  PostingId,
  ReferenceId,
  SettlementState
} from "@ryvra/contracts";
import {
  asAccountId,
  asAssetId,
  asCorrelationId,
  asIdempotencyKey,
  asLedgerEventId,
  asPostingId,
  asReferenceId
} from "@ryvra/contracts";

export interface SandboxContext {
  now: () => string;
  nextEventId: () => LedgerEventId;
  nextPostingId: () => PostingId;
  nextReferenceId: () => ReferenceId;
  nextCorrelationId: () => CorrelationId;
  accounts: Map<AccountId, { jurisdiction: string }>;
  assetRestrictions: Map<AssetId, boolean>;
  intentsByReplayKey: Map<string, PaymentIntent>;
  decisionsByReference: Map<ReferenceId, PolicyDecisionOutput>;
  ledgerByReference: Map<ReferenceId, LedgerTransaction>;
  settlementByReference: Map<ReferenceId, SettlementState>;
  contributionsByReference: Map<ReferenceId, ContributionEvent>;
  events: EventEnvelope<unknown>[];
  duplicateAttemptCount: number;
  failedTransitionsCount: number;
}

export const createSandboxContext = (): SandboxContext => {
  const base = new Date("2026-01-01T00:00:00.000Z").getTime();
  let tick = 0;
  let eventSequence = 0;
  let postingSequence = 0;
  let refSequence = 0;
  let correlationSequence = 0;

  return {
    now: () => new Date(base + tick++ * 1000).toISOString(),
    nextEventId: () => asLedgerEventId(`evt_${++eventSequence}`),
    nextPostingId: () => asPostingId(`pst_${++postingSequence}`),
    nextReferenceId: () => asReferenceId(`ref_${++refSequence}`),
    nextCorrelationId: () => asCorrelationId(`corr_${++correlationSequence}`),
    accounts: new Map(),
    assetRestrictions: new Map([[asAssetId("asset_USDC"), false], [asAssetId("asset_BLOCKED"), true]]),
    intentsByReplayKey: new Map(),
    decisionsByReference: new Map(),
    ledgerByReference: new Map(),
    settlementByReference: new Map(),
    contributionsByReference: new Map(),
    events: [],
    duplicateAttemptCount: 0,
    failedTransitionsCount: 0
  };
};

export const makeReplayKey = (referenceId: ReferenceId, idempotencyKey: IdempotencyKey): string =>
  `${referenceId}::${idempotencyKey}`;

export const account = (value: string): AccountId => asAccountId(value);
export const asset = (value: string): AssetId => asAssetId(value);
export const reference = (value: string): ReferenceId => asReferenceId(value);
export const idempotency = (value: string): IdempotencyKey => asIdempotencyKey(value);
