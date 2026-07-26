import {
  PaymentIntentState,
  SettlementState,
  asCorrelationId,
  asIdempotencyKey,
  asReferenceId,
  type PaymentIntent
} from "@ryvra/contracts";

import { PayConflictError } from "../errors.js";
import { callbackDedupeKey, InMemoryCallbackDedupeStore, InMemoryIdempotencyCache, payReplayKey } from "../idempotency.js";
import { mapCallbackEventToState } from "../mapper.js";
import { InMemoryOutbox } from "../outbox.js";
import { applyPaymentTransition } from "../state-machine.js";
import { assertCallbackInput, assertCreatePaymentIntentInput, assertQueryPaymentStatusInput } from "../validator.js";
import type {
  DeterministicPayAdapterConfig,
  PayAdapter,
  PayAdapterContext,
  PayCallbackInput,
  PayCreateInput,
  PayQueryInput,
  PayQueryResult,
  PayRecord,
  PayResult
} from "../types.js";

const nowIso = (context?: PayAdapterContext): string => context?.now?.() ?? new Date(0).toISOString();
const nowMs = (context?: PayAdapterContext): number => context?.nowMs?.() ?? Date.now();

export class InMemoryPayRuntime {
  private readonly cache = new InMemoryIdempotencyCache<PayResult>();
  private readonly callbacks = new InMemoryCallbackDedupeStore(this.config.callbackDedupeTtlMs);
  private readonly records = new Map<string, PayRecord>();
  readonly outbox = new InMemoryOutbox();

  constructor(private readonly config: { callbackDedupeTtlMs: number }) {}

  async create(input: PayCreateInput, context?: PayAdapterContext): Promise<PayResult> {
    assertCreatePaymentIntentInput(input);
    const replayKey = payReplayKey(input.reference_id, input.idempotency_key);

    return this.cache.dedupe(replayKey, async () => {
      const existing = this.records.get(replayKey);
      if (existing) {
        return this.toResult(existing, false);
      }

      const intent: PaymentIntent = {
        intent_id: input.reference_id,
        account_id: input.account_id,
        asset_id: input.asset_id,
        amount_minor: input.amount_minor,
        state: PaymentIntentState.created,
        reference_id: input.reference_id,
        idempotency_key: input.idempotency_key,
        correlation_id: input.correlation_id,
        created_at: nowIso(context)
      };

      const record: PayRecord = {
        intent,
        settlement_state: SettlementState.accepted,
        callbacks_processed: 0,
        reward_eligible: false,
        timed_out_pending_callback: false,
        state: PaymentIntentState.created,
        applied_side_effects: new Set()
      };
      this.records.set(replayKey, record);

      this.outbox.enqueue({
        correlation_id: intent.correlation_id,
        reference_id: intent.reference_id,
        event_type: "payment_intent.created",
        timestamp: nowIso(context),
        payload: { state: PaymentIntentState.created },
        dedupe_key: `${replayKey}::payment_intent.created`
      });

      const transition = applyPaymentTransition(record.state, PaymentIntentState.executing, { strict: true });
      record.state = transition.state;
      record.intent.state = transition.state;

      this.outbox.enqueue({
        correlation_id: intent.correlation_id,
        reference_id: intent.reference_id,
        event_type: "payment_intent.executing",
        timestamp: nowIso(context),
        payload: { state: PaymentIntentState.executing },
        dedupe_key: `${replayKey}::payment_intent.executing`
      });

      return this.toResult(record, false);
    });
  }

  async handleCallback(input: PayCallbackInput, context?: PayAdapterContext): Promise<PayResult> {
    assertCallbackInput(input);
    const replayKey = payReplayKey(input.reference_id, input.idempotency_key);
    const record = this.records.get(replayKey);
    if (!record) {
      throw new PayConflictError("Callback reference/idempotency pair was not initialized by createPaymentIntent.");
    }

    const dedupeKey = callbackDedupeKey({
      providerEventId: input.provider_event_id,
      referenceId: input.reference_id,
      idempotencyKey: input.idempotency_key,
      eventType: input.event_type
    });

    if (this.callbacks.seen(dedupeKey, nowMs(context))) {
      this.outbox.enqueue({
        correlation_id: input.correlation_id,
        reference_id: input.reference_id,
        event_type: "idempotency.duplicate_detected",
        timestamp: nowIso(context),
        payload: { reason_codes: ["DUPLICATE_REFERENCE_CALLBACK_REPLAY"], dedupe_key: dedupeKey },
        dedupe_key: `${replayKey}::duplicate::${dedupeKey}`
      });
      return this.toResult(record, true);
    }
    this.callbacks.mark(dedupeKey, nowMs(context));

    record.callbacks_processed += 1;
    const nextState = mapCallbackEventToState(input.event_type);
    const transition = applyPaymentTransition(record.state, nextState);

    if (transition.stale) {
      this.outbox.enqueue({
        correlation_id: input.correlation_id,
        reference_id: input.reference_id,
        event_type: "callback.stale_ignored",
        timestamp: nowIso(context),
        payload: { from_state: record.state, attempted_state: nextState },
        dedupe_key: `${replayKey}::stale::${input.event_type}::${dedupeKey}`
      });
      return this.toResult(record, false);
    }

    if (!transition.applied && transition.state === record.state && nextState !== record.state) {
      throw new PayConflictError(`Invalid callback transition ${record.state} -> ${nextState}.`);
    }

    record.state = transition.state;
    record.intent.state = transition.state;

    this.outbox.enqueue({
      correlation_id: input.correlation_id,
      reference_id: input.reference_id,
      event_type: "payment_intent.transitioned",
      timestamp: nowIso(context),
      payload: { to_state: transition.state },
      dedupe_key: `${replayKey}::transition::${transition.state}`
    });

    if (transition.state === PaymentIntentState.settled) {
      if (!record.applied_side_effects.has("settled")) {
        record.applied_side_effects.add("settled");
        record.settlement_state = SettlementState.reconciled;
        record.reward_eligible = true;
        record.timed_out_pending_callback = false;
        this.outbox.enqueue({
          correlation_id: input.correlation_id,
          reference_id: input.reference_id,
          event_type: "pot.contribution_eligible",
          timestamp: nowIso(context),
          payload: { reward_eligible: true },
          dedupe_key: `${replayKey}::pot.contribution_eligible`
        });
      }
    } else if (transition.state === PaymentIntentState.failed) {
      record.settlement_state = SettlementState.failed;
      record.reward_eligible = false;
    } else if (transition.state === PaymentIntentState.reversed) {
      record.settlement_state = SettlementState.failed;
      record.reward_eligible = false;
      this.outbox.enqueue({
        correlation_id: input.correlation_id,
        reference_id: input.reference_id,
        event_type: "payment_intent.reversed_compensating_event",
        timestamp: nowIso(context),
        payload: { compensating_event: true },
        dedupe_key: `${replayKey}::payment_intent.reversed_compensating_event`
      });
    }

    return this.toResult(record, false);
  }

  async query(input: PayQueryInput): Promise<PayQueryResult> {
    assertQueryPaymentStatusInput(input);
    const replayKey = payReplayKey(input.reference_id, input.idempotency_key);
    const record = this.records.get(replayKey);
    if (!record) {
      throw new PayConflictError("Payment intent was not found for provided reference/idempotency pair.");
    }

    return {
      ...this.toResult(record, false),
      callbacks_processed: record.callbacks_processed
    };
  }

  markTimeoutPending(input: { reference_id: string; idempotency_key: string }): void {
    const key = payReplayKey(asReferenceId(input.reference_id), asIdempotencyKey(input.idempotency_key));
    const record = this.records.get(key);
    if (record) {
      record.timed_out_pending_callback = true;
      record.reward_eligible = false;
    }
  }

  upsertFromHttpCreate(input: {
    createInput: PayCreateInput;
    state: PaymentIntentState;
    settlementState?: SettlementState;
    timedOutPendingCallback: boolean;
    rewardEligible: boolean;
    context?: PayAdapterContext;
  }): PayResult {
    const key = payReplayKey(input.createInput.reference_id, input.createInput.idempotency_key);
    const existing = this.records.get(key);
    if (existing) {
      return this.toResult(existing, false);
    }

    const intent: PaymentIntent = {
      intent_id: input.createInput.reference_id,
      account_id: input.createInput.account_id,
      asset_id: input.createInput.asset_id,
      amount_minor: input.createInput.amount_minor,
      state: input.state,
      reference_id: input.createInput.reference_id,
      idempotency_key: input.createInput.idempotency_key,
      correlation_id: input.createInput.correlation_id,
      created_at: nowIso(input.context)
    };

    const record: PayRecord = {
      intent,
      settlement_state: input.settlementState,
      callbacks_processed: 0,
      reward_eligible: input.rewardEligible,
      timed_out_pending_callback: input.timedOutPendingCallback,
      state: input.state,
      applied_side_effects: new Set(input.rewardEligible ? ["settled"] : [])
    };

    this.records.set(key, record);
    this.cache.dedupe(key, async () => this.toResult(record, false)).catch(() => undefined);

    this.outbox.enqueue({
      correlation_id: input.createInput.correlation_id,
      reference_id: input.createInput.reference_id,
      event_type: "payment_intent.created",
      timestamp: nowIso(input.context),
      payload: { state: input.state, timed_out_pending_callback: input.timedOutPendingCallback },
      dedupe_key: `${key}::payment_intent.created`
    });

    return this.toResult(record, false);
  }

  private toResult(record: PayRecord, duplicate: boolean): PayResult {
    return {
      intent: { ...record.intent, state: record.state },
      settlement_state: record.settlement_state,
      duplicate_detected: duplicate,
      reward_eligible: record.reward_eligible
    };
  }
}

export const createDeterministicPayAdapter = (config: DeterministicPayAdapterConfig): PayAdapter => {
  const runtime = new InMemoryPayRuntime({ callbackDedupeTtlMs: config.callbackDedupeTtlMs });

  return {
    createPaymentIntent: (input, context) => runtime.create(input, context),
    handleProviderCallback: (input, context) => runtime.handleCallback(input, context),
    queryPaymentStatus: (input) => runtime.query(input)
  };
};

export const createDeterministicPayRuntimeAdapter = (
  config: DeterministicPayAdapterConfig
): { adapter: PayAdapter; runtime: InMemoryPayRuntime } => {
  const runtime = new InMemoryPayRuntime({ callbackDedupeTtlMs: config.callbackDedupeTtlMs });
  return {
    adapter: {
      createPaymentIntent: (input, context) => runtime.create(input, context),
      handleProviderCallback: (input, context) => runtime.handleCallback(input, context),
      queryPaymentStatus: (input) => runtime.query(input)
    },
    runtime
  };
};
