import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ASSET_POSITION_FIELDS,
  BUNDLER_REF_FIELDS,
  CANONICAL_EVENT_ENVELOPE_FIELDS,
  CANONICAL_AMOUNT_FIELDS,
  CANONICAL_ID_FIELDS,
  CHAIN_ASSET_REF_FIELDS,
  CONTRACT_SCHEMA_VERSION,
  ENTRY_POINT_REF_FIELDS,
  EXPOSURE_SNAPSHOT_FIELDS,
  PAYMASTER_REF_FIELDS,
  POLICY_REASON_CODES_VERSION,
  PR7_UNIFIED_ASSET_SCHEMA_VERSION,
  PR8_ERC4337_SCHEMA_VERSION,
  SMART_ACCOUNT_REF_FIELDS,
  SPONSORSHIP_POLICY_DECISION_FIELDS,
  SPONSORSHIP_POLICY_INPUT_FIELDS,
  USER_OPERATION_CANONICAL_FIELDS,
  USER_OPERATION_EVENT_TYPES,
  USER_OPERATION_FAILED_PAYLOAD_FIELDS,
  USER_OPERATION_FINALIZED_PAYLOAD_FIELDS,
  USER_OPERATION_INCLUDED_PAYLOAD_FIELDS,
  UserOperationLifecycleStatus,
  USER_OPERATION_REPLAY_RECORD_FIELDS,
  USER_OPERATION_SIMULATED_PAYLOAD_FIELDS,
  USER_OPERATION_SIMULATION_RESULT_FIELDS,
  USER_OPERATION_SUBMITTED_PAYLOAD_FIELDS,
  UserOperationSimulationOutcome,
  UNIFIED_ASSET_FIELDS,
  UNIFIED_BALANCE_FIELDS
} from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("schema snapshot is deterministic", async () => {
  const fixturePath = path.resolve(__dirname, "../../fixtures/schema-snapshot.v1.json");
  const snapshot = JSON.parse(await readFile(fixturePath, "utf8"));

  const actual = {
    versions: {
      CONTRACT_SCHEMA_VERSION,
      POLICY_REASON_CODES_VERSION,
      PR7_UNIFIED_ASSET_SCHEMA_VERSION,
      PR8_ERC4337_SCHEMA_VERSION
    },
    exportSurface: [
      "./ids.js",
      "./enums.js",
      "./policy.js",
      "./payments.js",
      "./ledger.js",
      "./events.js",
      "./version.js",
      "./canonical.js",
      "./governance.js",
      "./unified-assets.js",
      "./aa4337.js",
      "./userop-events.js"
    ],
    canonicalFields: {
      CANONICAL_ID_FIELDS,
      CANONICAL_EVENT_ENVELOPE_FIELDS,
      CHAIN_ASSET_REF_FIELDS,
      CANONICAL_AMOUNT_FIELDS,
      UNIFIED_ASSET_FIELDS,
      UNIFIED_BALANCE_FIELDS,
      ASSET_POSITION_FIELDS,
      EXPOSURE_SNAPSHOT_FIELDS,
      SMART_ACCOUNT_REF_FIELDS,
      ENTRY_POINT_REF_FIELDS,
      BUNDLER_REF_FIELDS,
      PAYMASTER_REF_FIELDS,
      USER_OPERATION_CANONICAL_FIELDS,
      SPONSORSHIP_POLICY_INPUT_FIELDS,
      SPONSORSHIP_POLICY_DECISION_FIELDS,
      USER_OPERATION_SIMULATION_RESULT_FIELDS,
      USER_OPERATION_REPLAY_RECORD_FIELDS,
      USER_OPERATION_EVENT_TYPES,
      USER_OPERATION_SUBMITTED_PAYLOAD_FIELDS,
      USER_OPERATION_SIMULATED_PAYLOAD_FIELDS,
      USER_OPERATION_INCLUDED_PAYLOAD_FIELDS,
      USER_OPERATION_FAILED_PAYLOAD_FIELDS,
      USER_OPERATION_FINALIZED_PAYLOAD_FIELDS
    },
    enumValues: {
      UserOperationLifecycleStatus: Object.values(UserOperationLifecycleStatus),
      UserOperationSimulationOutcome: Object.values(UserOperationSimulationOutcome)
    }
  };

  assert.deepEqual(actual, snapshot);
});
