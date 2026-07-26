import test from "node:test";
import assert from "node:assert/strict";

import { asIdempotencyKey, asReferenceId } from "@ryvra/contracts";

import { InMemoryIdempotencyCache, ledgerSettlementReplayKey } from "../src/idempotency.js";

test("replay key is canonical reference_id::idempotency_key", () => {
  assert.equal(
    ledgerSettlementReplayKey(asReferenceId("ref_abc"), asIdempotencyKey("idem_abc")),
    "ref_abc::idem_abc"
  );
});

test("idempotency cache deduplicates in-flight and settled producer", async () => {
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
