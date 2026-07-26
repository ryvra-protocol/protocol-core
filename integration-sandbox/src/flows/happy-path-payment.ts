import {
  PaymentIntentState,
  PolicyDecision,
  SettlementState,
  asIdempotencyKey,
  type PaymentIntent
} from "@ryvra/contracts";

import { createSandboxContext, makeReplayKey, type SandboxContext } from "../context.js";
import { emitEvent } from "../logging/event-log.js";
import { createAccount } from "../mocks/accounts.mock.js";
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

export const runHappyPathPayment = async (input: HappyPathInput): Promise<{ context: SandboxContext; result: PaymentFlowResult }> => {
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

  const decision = await context.policyRiskAdapter.evaluate(
    {
      account_id: intent.account_id,
      asset_id: intent.asset_id,
      amount_minor: intent.amount_minor,
      reference_id: intent.reference_id,
      idempotency_key: intent.idempotency_key,
      correlation_id,
      policy_version: context.policyRiskVersion,
      jurisdiction: context.accounts.get(intent.account_id)?.jurisdiction,
      risk_score: input.risk_score
    },
    {
      now: context.now,
      isAssetRestricted: (assetId) => context.assetRestrictions.get(assetId) === true
    }
  );

  context.decisionsByReference.set(intent.reference_id, decision);
  emitEvent(context, intent.reference_id, correlation_id, "policy.decision", { decision });

  if (decision.decision !== PolicyDecision.ALLOW) {
    const failedSettlement = await context.ledgerSettlementAdapter.advanceSettlement(
      {
        reference_id: intent.reference_id,
        correlation_id,
        idempotency_key: asIdempotencyKey(`${intent.idempotency_key}:failed`),
        next_state: SettlementState.failed
      },
      {
        now: context.now,
        nextEventId: context.nextEventId
      }
    );
    context.settlementByReference.set(intent.reference_id, failedSettlement.settlement_state);
    context.failedTransitionsCount += 1;
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
  const postResult = await context.ledgerSettlementAdapter.postTransaction(
    {
      reference_id: intent.reference_id,
      correlation_id,
      idempotency_key: intent.idempotency_key,
      policy_version: context.policyRiskVersion,
      postings: [
        {
          account_id: input.payer,
          asset_id: input.asset_id,
          amount_minor: input.amount_minor,
          direction: "debit"
        },
        {
          account_id: input.payee,
          asset_id: input.asset_id,
          amount_minor: input.amount_minor,
          direction: "credit"
        }
      ]
    },
    {
      now: context.now,
      nextEventId: context.nextEventId,
      nextPostingId: context.nextPostingId
    }
  );
  const { ledger_transaction } = postResult;
  context.ledgerByReference.set(intent.reference_id, ledger_transaction);
  context.settlementByReference.set(intent.reference_id, postResult.settlement_state);
  emitEvent(context, intent.reference_id, correlation_id, "ledger.transaction_created", { ledger_transaction });

  const finalized = await context.ledgerSettlementAdapter.advanceSettlement(
    {
      reference_id: intent.reference_id,
      correlation_id,
      idempotency_key: asIdempotencyKey(`${intent.idempotency_key}:finalized`),
      next_state: SettlementState.finalized
    },
    {
      now: context.now,
      nextEventId: context.nextEventId
    }
  );
  context.settlementByReference.set(intent.reference_id, finalized.settlement_state);
  emitEvent(context, intent.reference_id, correlation_id, "settlement.finalized", { state: SettlementState.finalized });

  const reconciled = await context.ledgerSettlementAdapter.advanceSettlement(
    {
      reference_id: intent.reference_id,
      correlation_id,
      idempotency_key: asIdempotencyKey(`${intent.idempotency_key}:reconciled`),
      next_state: SettlementState.reconciled
    },
    {
      now: context.now,
      nextEventId: context.nextEventId
    }
  );
  context.settlementByReference.set(intent.reference_id, reconciled.settlement_state);
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
