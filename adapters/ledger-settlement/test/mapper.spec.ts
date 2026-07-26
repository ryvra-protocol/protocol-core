import test from "node:test";
import assert from "node:assert/strict";

import {
  asAccountId,
  asAssetId,
  asCorrelationId,
  asIdempotencyKey,
  asPostingId,
  asReferenceId
} from "@ryvra/contracts";

import {
  toCanonicalPostTransactionResult,
  toCanonicalReconcileResult,
  toUpstreamPostTransactionRequest
} from "../src/mapper.js";

test("mapper creates canonical upstream postTransaction request", () => {
  const payload = toUpstreamPostTransactionRequest({
    reference_id: asReferenceId("ref_map"),
    correlation_id: asCorrelationId("corr_map"),
    idempotency_key: asIdempotencyKey("idem_map"),
    postings: [
      {
        posting_id: asPostingId("pst_map_1"),
        account_id: asAccountId("acct_map_1"),
        asset_id: asAssetId("asset_map"),
        amount_minor: 8,
        direction: "debit"
      },
      {
        posting_id: asPostingId("pst_map_2"),
        account_id: asAccountId("acct_map_2"),
        asset_id: asAssetId("asset_map"),
        amount_minor: 8,
        direction: "credit"
      }
    ]
  });

  assert.deepEqual(payload, {
    ledger_event_id: undefined,
    reference_id: "ref_map",
    correlation_id: "corr_map",
    idempotency_key: "idem_map",
    policy_version: undefined,
    created_at: undefined,
    postings: [
      {
        posting_id: "pst_map_1",
        account_id: "acct_map_1",
        asset_id: "asset_map",
        amount_minor: 8,
        direction: "debit"
      },
      {
        posting_id: "pst_map_2",
        account_id: "acct_map_2",
        asset_id: "asset_map",
        amount_minor: 8,
        direction: "credit"
      }
    ]
  });
});

test("mapper drops non-canonical fields from upstream postTransaction response", () => {
  const result = toCanonicalPostTransactionResult(
    {
      ledger_event_id: "evt_map",
      reference_id: "ref_map",
      created_at: "2026-01-01T00:00:00.000Z",
      settlement_state: "accepted",
      duplicate_replay: false,
      postings: [
        {
          posting_id: asPostingId("pst_map_1"),
          account_id: asAccountId("acct_map_1"),
          asset_id: asAssetId("asset_map"),
          amount_minor: 5,
          direction: "debit"
        },
        {
          posting_id: asPostingId("pst_map_2"),
          account_id: asAccountId("acct_map_2"),
          asset_id: asAssetId("asset_map"),
          amount_minor: 5,
          direction: "credit"
        }
      ],
      contribution_id: "legacy-should-drop"
    } as never,
    {
      ledgerEventId: "evt_fallback",
      referenceId: "ref_fallback",
      postings: [
        {
          posting_id: asPostingId("pst_f_1"),
          account_id: asAccountId("acct_f_1"),
          asset_id: asAssetId("asset_f"),
          amount_minor: 1,
          direction: "debit"
        },
        {
          posting_id: asPostingId("pst_f_2"),
          account_id: asAccountId("acct_f_2"),
          asset_id: asAssetId("asset_f"),
          amount_minor: 1,
          direction: "credit"
        }
      ],
      createdAt: "2026-01-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(result, {
    ledger_transaction: {
      ledger_event_id: "evt_map",
      reference_id: "ref_map",
      created_at: "2026-01-01T00:00:00.000Z",
      postings: [
        {
          posting_id: "pst_map_1",
          account_id: "acct_map_1",
          asset_id: "asset_map",
          amount_minor: 5,
          direction: "debit"
        },
        {
          posting_id: "pst_map_2",
          account_id: "acct_map_2",
          asset_id: "asset_map",
          amount_minor: 5,
          direction: "credit"
        }
      ]
    },
    settlement_state: "accepted",
    duplicate_replay: false
  });
});

test("mapper rejects invalid upstream settlement state", () => {
  assert.throws(() => {
    toCanonicalReconcileResult(
      {
        items: [{ reference_id: "ref_1", settlement_state: "queued" }]
      },
      {
        reference_ids: [asReferenceId("ref_1")],
        reference_id: asReferenceId("ref_1"),
        correlation_id: asCorrelationId("corr_1"),
        idempotency_key: asIdempotencyKey("idem_1")
      }
    );
  });
});
