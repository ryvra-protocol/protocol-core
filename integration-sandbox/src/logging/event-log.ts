import type { EventEnvelope, ReferenceId } from "@ryvra/contracts";

import type { SandboxContext } from "../context.js";

export const emitEvent = <TPayload>(
  context: SandboxContext,
  reference_id: ReferenceId,
  correlation_id: EventEnvelope<TPayload>["correlation_id"],
  event_type: string,
  payload: TPayload
): EventEnvelope<TPayload> => {
  const event: EventEnvelope<TPayload> = {
    event_id: context.nextEventId(),
    correlation_id,
    reference_id,
    event_type,
    timestamp: context.now(),
    payload
  };

  context.events.push(event as EventEnvelope<unknown>);
  context.events.sort((a, b) =>
    a.timestamp === b.timestamp ? `${a.event_id}`.localeCompare(`${b.event_id}`) : a.timestamp.localeCompare(b.timestamp)
  );

  return event;
};
