import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CONTRACT_SCHEMA_VERSION,
  POLICY_REASON_CODES_VERSION,
  PR7_UNIFIED_ASSET_SCHEMA_VERSION,
  PR8_ERC4337_SCHEMA_VERSION
} from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("downstream compatibility fixture is aligned to frozen schema versions", async () => {
  const fixturePath = path.resolve(__dirname, "../../fixtures/downstream-compatibility-fixtures.json");
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.ok(Array.isArray(fixture.consumers));
  assert.ok(fixture.consumers.length > 0);

  for (const consumer of fixture.consumers) {
    assert.equal(consumer.requiredVersions.contractSchema, CONTRACT_SCHEMA_VERSION);
    assert.equal(consumer.requiredVersions.policyReasonCodes, POLICY_REASON_CODES_VERSION);
    assert.equal(consumer.requiredVersions.pr7UnifiedAsset, PR7_UNIFIED_ASSET_SCHEMA_VERSION);
    assert.equal(consumer.requiredVersions.pr8Erc4337, PR8_ERC4337_SCHEMA_VERSION);
    assert.ok(Array.isArray(consumer.requiredChecks));
    assert.ok(consumer.requiredChecks.length > 0);
  }
});
