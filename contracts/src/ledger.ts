import type { AccountId, AssetId, LedgerEventId, PostingId, ReferenceId } from "./ids.js";
import { SettlementState } from "./enums.js";

export interface LedgerPosting {
  posting_id: PostingId;
  account_id: AccountId;
  asset_id: AssetId;
  amount_minor: number;
  direction: "debit" | "credit";
}

export interface LedgerTransaction {
  ledger_event_id: LedgerEventId;
  reference_id: ReferenceId;
  postings: [LedgerPosting, LedgerPosting, ...LedgerPosting[]];
  created_at: string;
}

export interface SettlementTransitionEvent {
  reference_id: ReferenceId;
  from_state: SettlementState;
  to_state: SettlementState;
  transitioned_at: string;
}
