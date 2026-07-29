import test from "node:test";
import assert from "node:assert/strict";

import {
  asAccountId,
  asAssetId,
  asCorrelationId,
  asIdempotencyKey,
  asLedgerEventId,
  asReferenceId,
  type CorrelationId,
  type EventEnvelope,
  type ReferenceId,
  PaymentIntentState
} from "@ryvra/contracts";

import { createDeterministicPayAdapter } from "../src/modes/deterministic.js";
import type { CallbackDedupeStore, OutboxMessage, PayOutbox } from "../src/types.js";

const input = {
  reference_id: asReferenceId("ref_det"),
  idempotency_key: asIdempotencyKey("idem_det"),
  correlation_id: asCorrelationId("corr_det"),
  amount_minor: 100,
  account_id: asAccountId("acct_det"),
  asset_id: asAssetId("asset_det")
};

test("deterministic client enforces callback dedupe and idempotent transitions", async () => {
  const adapter = createDeterministicPayAdapter({
    mode: "deterministic",
    callbackDedupeTtlMs: 60_000
  });

  const created = await adapter.createPaymentIntent(input);
  assert.equal(created.intent.state, PaymentIntentState.executing);

  const first = await adapter.handleProviderCallback({ ...input, event_type: "settled", provider_event_id: "evt_1" });
  const duplicate = await adapter.handleProviderCallback({ ...input, event_type: "settled", provider_event_id: "evt_1" });

  assert.equal(first.intent.state, PaymentIntentState.settled);
  assert.equal(first.reward_eligible, true);
  assert.equal(duplicate.duplicate_detected, true);
});

test("deterministic client supports injected callback/outbox persistence boundaries", async () => {
  const seenKeys = new Set<string>();
  const dedupe: CallbackDedupeStore = {
    seen(key) {
      return seenKeys.has(key);
    },
    mark(key) {
      seenKeys.add(key);
    }
  };

  const messages: OutboxMessage[] = [];
  let sequence = 0;
  const outbox: PayOutbox = {
    enqueue<TPayload>(input: {
      correlation_id: CorrelationId;
      reference_id: ReferenceId;
      event_type: string;
      timestamp: string;
      payload: TPayload;
      dedupe_key: string;
    }): EventEnvelope<TPayload> {
      const existing = messages.find((message) => message.delivery_key === input.dedupe_key);
      if (existing) {
        return existing.envelope as EventEnvelope<TPayload>;
      }
      const envelope: EventEnvelope<TPayload> = {
        event_id: asLedgerEventId(`evt_mock_${++sequence}`),
        correlation_id: input.correlation_id,
        reference_id: input.reference_id,
        event_type: input.event_type,
        timestamp: input.timestamp,
        payload: input.payload
      };
      messages.push({ envelope, delivery_key: input.dedupe_key, delivered: false });
      return envelope;
    },
    pending() {
      return messages.filter((message) => !message.delivered);
    },
    markDelivered(eventId) {
      const message = messages.find((entry) => `${entry.envelope.event_id}` === eventId);
      if (message) {
        message.delivered = true;
      }
    },
    all() {
      return [...messages];
    }
  };

  const adapter = createDeterministicPayAdapter({
    mode: "deterministic",
    callbackDedupeTtlMs: 60_000,
    persistence: {
      callbackDedupeStore: dedupe,
      outbox
    }
  });

  await adapter.createPaymentIntent(input);
  await adapter.handleProviderCallback({ ...input, event_type: "settled", provider_event_id: "evt_2" });
  const duplicate = await adapter.handleProviderCallback({ ...input, event_type: "settled", provider_event_id: "evt_2" });

  assert.equal(duplicate.duplicate_detected, true);
  assert.equal(outbox.all().some((entry) => entry.envelope.event_type === "idempotency.duplicate_detected"), true);
});
