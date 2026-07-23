import {
  PaymentIntentState,
  PolicyDecision,
  SettlementState,
  type PaymentIntent
} from "@ryvra/contracts";

import { createSandboxContext, makeReplayKey, type SandboxContext } from "../context.js";
import { emitEvent } from "../logging/event-log.js";
import { createAccount } from "../mocks/accounts.mock.js";
import { createBalancedTransaction, hasDoubleEntryBalance, transitionSettlement } from "../mocks/ledger-settlement.mock.js";
import { evaluatePolicy } from "../mocks/policy-risk.mock.js";
import { emitContribution } from "../mocks/pot-engine.mock.js";
import type { PaymentFlowResult } from "../types.js";

export interface HappyPathInput {
  context?: SandboxContext;
  payer: ReturnType<typeof import("../context.js").account>;
  payee: ReturnType<typeof import("../context.js").account>;
  asset_id: ReturnType<typeof import("../context.js").asset>;
  amount_minor: number;
  reference_id: ReturnType<typeof import("../context.js").reference>;
  idempotency_key: ReturnType<typeof import("../context.js").idempotency>;
  risk_score: number;
}

export const runHappyPathPayment = (input: HappyPathInput): { context: SandboxContext; result: PaymentFlowResult } => {
  const context = input.context ?? createSandboxContext();
  createAccount(context, input.payer);
  createAccount(context, input.payee);

  const correlation_id = context.nextCorrelationId();
  const intent: PaymentIntent = {
    intent_id: input.reference_id,
    account_id: input.payer,
    asset_id: input.asset_id,
    amount_minor: input.amount_minor,
    state: PaymentIntentState.created,
    reference_id: input.reference_id,
    idempotency_key: input.idempotency_key,
    correlation_id,
    created_at: context.now()
  };

  const replayKey = makeReplayKey(input.reference_id, input.idempotency_key);
  context.intentsByReplayKey.set(replayKey, intent);
  emitEvent(context, intent.reference_id, correlation_id, "payment_intent.created", { intent });

  const decision = evaluatePolicy(context, {
    account_id: intent.account_id,
    asset_id: intent.asset_id,
    amount_minor: intent.amount_minor,
    reference_id: intent.reference_id,
    risk_score: input.risk_score
  });
  emitEvent(context, intent.reference_id, correlation_id, "policy.decision", { decision });

  if (decision.decision !== PolicyDecision.ALLOW) {
    transitionSettlement(context, intent.reference_id, SettlementState.failed);
    emitEvent(context, intent.reference_id, correlation_id, "payment.denied", { reason_codes: decision.reason_codes });
    return {
      context,
      result: {
        intent,
        decision,
        settlement_state: SettlementState.failed,
        duplicate_detected: false
      }
    };
  }

  intent.state = PaymentIntentState.executing;
  const ledger_transaction = createBalancedTransaction(context, {
    reference_id: intent.reference_id,
    from_account_id: input.payer,
    to_account_id: input.payee,
    asset_id: input.asset_id,
    amount_minor: input.amount_minor
  });
  emitEvent(context, intent.reference_id, correlation_id, "ledger.transaction_created", { ledger_transaction });

  if (!hasDoubleEntryBalance(ledger_transaction)) {
    transitionSettlement(context, intent.reference_id, SettlementState.failed);
    emitEvent(context, intent.reference_id, correlation_id, "ledger.invariant_failed", { reference_id: intent.reference_id });
    return {
      context,
      result: {
        intent,
        decision,
        settlement_state: SettlementState.failed,
        ledger_transaction,
        duplicate_detected: false
      }
    };
  }

  transitionSettlement(context, intent.reference_id, SettlementState.finalized);
  emitEvent(context, intent.reference_id, correlation_id, "settlement.finalized", { state: SettlementState.finalized });

  transitionSettlement(context, intent.reference_id, SettlementState.reconciled);
  intent.state = PaymentIntentState.settled;
  emitEvent(context, intent.reference_id, correlation_id, "settlement.reconciled", { state: SettlementState.reconciled });

  const contribution_event = emitContribution(context, ledger_transaction);
  emitEvent(context, intent.reference_id, correlation_id, "pot.contribution_emitted", { contribution_event });

  return {
    context,
    result: {
      intent,
      decision,
      settlement_state: SettlementState.reconciled,
      ledger_transaction,
      contribution_event,
      duplicate_detected: false
    }
  };
};
