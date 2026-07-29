import type { CorrelationId, EventEnvelope, ReferenceId } from "@ryvra/contracts";
import { asLedgerEventId } from "@ryvra/contracts";

import type { OutboxMessage, PayOutbox } from "./types.js";

export class InMemoryOutbox implements PayOutbox {
  private readonly messages: OutboxMessage[] = [];
  private sequence = 0;

  enqueue<TPayload>(input: {
    correlation_id: CorrelationId;
    reference_id: ReferenceId;
    event_type: string;
    timestamp: string;
    payload: TPayload;
    dedupe_key: string;
  }): EventEnvelope<TPayload> {
    const existing = this.messages.find((message) => message.delivery_key === input.dedupe_key);
    if (existing) {
      return existing.envelope as EventEnvelope<TPayload>;
    }

    const envelope: EventEnvelope<TPayload> = {
      event_id: asLedgerEventId(`evt_pay_${++this.sequence}`),
      correlation_id: input.correlation_id,
      reference_id: input.reference_id,
      event_type: input.event_type,
      timestamp: input.timestamp,
      payload: input.payload
    };

    this.messages.push({ envelope, delivery_key: input.dedupe_key, delivered: false });
    return envelope;
  }

  pending(): OutboxMessage[] {
    return this.messages.filter((message) => !message.delivered);
  }

  markDelivered(eventId: string): void {
    const message = this.messages.find((entry) => `${entry.envelope.event_id}` === eventId);
    if (message) {
      message.delivered = true;
    }
  }

  all(): OutboxMessage[] {
    return [...this.messages];
  }
}
