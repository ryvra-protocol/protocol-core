import test from "node:test";
import assert from "node:assert/strict";

import { asIdempotencyKey, asReferenceId } from "@ryvra/contracts";

import { InMemoryIdempotencyCache, callbackDedupeKey, payReplayKey } from "../src/idempotency.js";

test("replay key is canonical reference_id::idempotency_key", () => {
  assert.equal(payReplayKey(asReferenceId("ref_a"), asIdempotencyKey("idem_a")), "ref_a::idem_a");
});

test("fallback callback dedupe key is stable", () => {
  assert.equal(
    callbackDedupeKey({
      referenceId: asReferenceId("ref_a"),
      idempotencyKey: asIdempotencyKey("idem_a"),
      eventType: "settled"
    }),
    "ref_a::idem_a::settled"
  );
});

test("idempotency cache deduplicates in-flight producer", async () => {
  const cache = new InMemoryIdempotencyCache<string>();
  let calls = 0;

  const [a, b] = await Promise.all([
    cache.dedupe("k", async () => {
      calls += 1;
      return "ok";
    }),
    cache.dedupe("k", async () => {
      calls += 1;
      return "no";
    })
  ]);

  assert.equal(a, "ok");
  assert.equal(b, "ok");
  assert.equal(calls, 1);
});
