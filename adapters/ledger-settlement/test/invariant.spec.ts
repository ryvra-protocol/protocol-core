import test from "node:test";
import assert from "node:assert/strict";

import { hasDoubleEntryBalance, sumCredits, sumDebits } from "../src/invariant.js";

test("double-entry invariant helper works", () => {
  const tx = {
    postings: [
      { amount_minor: 10, direction: "debit" as const },
      { amount_minor: 10, direction: "credit" as const }
    ]
  };

  assert.equal(sumDebits(tx as never), 10);
  assert.equal(sumCredits(tx as never), 10);
  assert.equal(hasDoubleEntryBalance(tx as never), true);
});

test("double-entry invariant detects imbalance", () => {
  const tx = {
    postings: [
      { amount_minor: 10, direction: "debit" as const },
      { amount_minor: 8, direction: "credit" as const }
    ]
  };

  assert.equal(hasDoubleEntryBalance(tx as never), false);
});
