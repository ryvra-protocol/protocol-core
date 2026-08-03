import type { AccountId, AssetId, Brand } from "./ids.js";
import { PR7_UNIFIED_ASSET_SCHEMA_VERSION } from "./version.js";

export type UnifiedAssetKind = "native" | "tokenized" | "derivative" | "program_defined";
export type UnifiedAssetSettlementClass = "immediate" | "delayed" | "conditional";
export type UnifiedAssetRiskFlag = "restricted" | "review_required" | (string & {});
export type UnifiedAssetMetadataRef = string;

export type CanonicalMinorAmount = Brand<string, "canonical_minor_amount">;
export type CanonicalDecimalAmount = Brand<string, "canonical_decimal_amount">;
export type CanonicalAssetDecimals = Brand<number, "canonical_asset_decimals">;

export const asCanonicalMinorAmount = (value: string): CanonicalMinorAmount => value as CanonicalMinorAmount;
export const asCanonicalDecimalAmount = (value: string): CanonicalDecimalAmount => value as CanonicalDecimalAmount;
export const asCanonicalAssetDecimals = (value: number): CanonicalAssetDecimals => value as CanonicalAssetDecimals;

export interface CanonicalAmount {
  amount_minor: CanonicalMinorAmount;
  amount_decimal: CanonicalDecimalAmount;
  decimals: CanonicalAssetDecimals;
}

export interface ChainAssetRef {
  chain_id: number;
  contract_ref?: string;
  token_standard?: string;
}

export interface UnifiedAsset {
  schema_version: typeof PR7_UNIFIED_ASSET_SCHEMA_VERSION;
  asset_id: AssetId;
  asset_type: UnifiedAssetKind;
  chain_asset_ref?: ChainAssetRef;
  decimals: CanonicalAssetDecimals;
  settlement_class: UnifiedAssetSettlementClass;
  risk_flags?: UnifiedAssetRiskFlag[];
  metadata_ref?: UnifiedAssetMetadataRef;
}

export interface UnifiedBalance {
  account_id: AccountId;
  unified_asset: UnifiedAsset;
  quantity: CanonicalAmount;
  as_of: string;
}

export interface AssetPosition {
  account_id: AccountId;
  asset_id: AssetId;
  available: CanonicalAmount;
  locked: CanonicalAmount;
  pending_settlement?: CanonicalAmount;
  as_of: string;
}

export interface ExposureSnapshot {
  schema_version: typeof PR7_UNIFIED_ASSET_SCHEMA_VERSION;
  account_id: AccountId;
  positions: AssetPosition[];
  gross_exposure: CanonicalAmount;
  net_exposure: CanonicalAmount;
  captured_at: string;
}

export const CHAIN_ASSET_REF_FIELDS = ["chain_id", "contract_ref", "token_standard"] as const;
export const CANONICAL_AMOUNT_FIELDS = ["amount_minor", "amount_decimal", "decimals"] as const;
export const UNIFIED_ASSET_FIELDS = [
  "schema_version",
  "asset_id",
  "asset_type",
  "chain_asset_ref",
  "decimals",
  "settlement_class",
  "risk_flags",
  "metadata_ref"
] as const;
export const UNIFIED_BALANCE_FIELDS = ["account_id", "unified_asset", "quantity", "as_of"] as const;
export const ASSET_POSITION_FIELDS = ["account_id", "asset_id", "available", "locked", "pending_settlement", "as_of"] as const;
export const EXPOSURE_SNAPSHOT_FIELDS = [
  "schema_version",
  "account_id",
  "positions",
  "gross_exposure",
  "net_exposure",
  "captured_at"
] as const;
