import type { AccountId, AssetId, CorrelationId, IdempotencyKey, ReferenceId } from "./ids.js";
import { PaymentIntentState } from "./enums.js";

export interface PaymentIntent {
  intent_id: ReferenceId;
  account_id: AccountId;
  asset_id: AssetId;
  amount_minor: number;
  state: PaymentIntentState;
  reference_id: ReferenceId;
  idempotency_key: IdempotencyKey;
  correlation_id: CorrelationId;
  created_at: string;
}
