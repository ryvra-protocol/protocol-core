export type Brand<T, B extends string> = T & { readonly __brand: B };

export type AccountId = Brand<string, "account_id">;
export type AssetId = Brand<string, "asset_id">;
export type LedgerEventId = Brand<string, "ledger_event_id">;
export type PostingId = Brand<string, "posting_id">;
export type ReferenceId = Brand<string, "reference_id">;
export type IdempotencyKey = Brand<string, "idempotency_key">;
export type PolicyVersion = Brand<string, "policy_version">;
export type CorrelationId = Brand<string, "correlation_id">;

export const asAccountId = (value: string): AccountId => value as AccountId;
export const asAssetId = (value: string): AssetId => value as AssetId;
export const asLedgerEventId = (value: string): LedgerEventId => value as LedgerEventId;
export const asPostingId = (value: string): PostingId => value as PostingId;
export const asReferenceId = (value: string): ReferenceId => value as ReferenceId;
export const asIdempotencyKey = (value: string): IdempotencyKey => value as IdempotencyKey;
export const asPolicyVersion = (value: string): PolicyVersion => value as PolicyVersion;
export const asCorrelationId = (value: string): CorrelationId => value as CorrelationId;
