import test from "node:test";
import assert from "node:assert/strict";

import { asCorrelationId, asReferenceId } from "@ryvra/contracts";

import { InMemoryOutbox } from "../src/outbox.js";

test("outbox deduplicates by delivery key and preserves deterministic order", () => {
  const outbox = new InMemoryOutbox();
  const correlationId = asCorrelationId("corr_1");
  const referenceId = asReferenceId("ref_1");

  outbox.enqueue({
    correlation_id: correlationId,
    reference_id: referenceId,
    event_type: "a",
    timestamp: "2026-01-01T00:00:00.000Z",
    payload: { a: 1 },
    dedupe_key: "k1"
  });
  outbox.enqueue({
    correlation_id: correlationId,
    reference_id: referenceId,
    event_type: "a",
    timestamp: "2026-01-01T00:00:00.001Z",
    payload: { a: 2 },
    dedupe_key: "k1"
  });

  assert.equal(outbox.all().length, 1);
  assert.equal(outbox.pending()[0]?.envelope.event_type, "a");
});
