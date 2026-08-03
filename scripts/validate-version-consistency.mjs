import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const workspaceManifests = [
  "contracts/package.json",
  "adapters/policy-risk/package.json",
  "adapters/ledger-settlement/package.json",
  "adapters/pay/package.json",
  "integration-sandbox/package.json"
];

const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

async function readJson(relativePath) {
  const content = await readFile(path.join(rootDir, relativePath), "utf8");
  return JSON.parse(content);
}

async function main() {
  const errors = [];
  const rootPackage = await readJson("package.json");

  const expectedVersion = rootPackage.version;
  const expectedPackageManager = rootPackage.packageManager;

  if (!expectedVersion || !semverPattern.test(expectedVersion)) {
    errors.push(`Root package version is not semver: ${expectedVersion ?? "<missing>"}`);
  }

  if (!expectedPackageManager || !expectedPackageManager.startsWith("pnpm@")) {
    errors.push(`Root packageManager must be pnpm-pinned, received: ${expectedPackageManager ?? "<missing>"}`);
  }

  for (const manifestPath of workspaceManifests) {
    const pkg = await readJson(manifestPath);

    if (pkg.version !== expectedVersion) {
      errors.push(`${manifestPath}: version ${pkg.version} does not match root version ${expectedVersion}`);
    }

    if (pkg.packageManager !== expectedPackageManager) {
      errors.push(
        `${manifestPath}: packageManager ${pkg.packageManager} does not match root packageManager ${expectedPackageManager}`
      );
    }
  }

  const versionSource = await readFile(path.join(rootDir, "contracts/src/version.ts"), "utf8");
  const versionMatches = {
    CONTRACT_SCHEMA_VERSION: versionSource.match(/CONTRACT_SCHEMA_VERSION\s*=\s*"([^"]+)"/)?.[1],
    POLICY_REASON_CODES_VERSION: versionSource.match(/POLICY_REASON_CODES_VERSION\s*=\s*"([^"]+)"/)?.[1],
    PR7_UNIFIED_ASSET_SCHEMA_VERSION: versionSource.match(/PR7_UNIFIED_ASSET_SCHEMA_VERSION\s*=\s*"([^"]+)"/)?.[1],
    PR8_ERC4337_SCHEMA_VERSION: versionSource.match(/PR8_ERC4337_SCHEMA_VERSION\s*=\s*"([^"]+)"/)?.[1]
  };

  for (const [key, value] of Object.entries(versionMatches)) {
    if (!value) {
      errors.push(`contracts/src/version.ts missing ${key}`);
      continue;
    }

    if (!semverPattern.test(value)) {
      errors.push(`${key} must be semver, received: ${value}`);
    }
  }

  const freezeManifest = await readJson("contracts/freeze/contract-freeze.json");
  const frozenVersions = freezeManifest.canonicalVersions;
  const frozenExports = freezeManifest.exportSurface;

  for (const [key, frozenValue] of Object.entries(frozenVersions)) {
    const actualValue = versionMatches[key];
    if (actualValue !== frozenValue) {
      errors.push(`${key} is frozen at ${frozenValue}, received: ${actualValue ?? "<missing>"}`);
    }
  }

  const indexSource = await readFile(path.join(rootDir, "contracts/src/index.ts"), "utf8");
  const exportSurface = [...indexSource.matchAll(/export \* from "([^"]+)";/g)].map((match) => match[1]);

  if (JSON.stringify(exportSurface) !== JSON.stringify(frozenExports)) {
    errors.push(
      `contracts/src/index.ts export surface changed.\nexpected: ${JSON.stringify(frozenExports)}\nactual: ${JSON.stringify(exportSurface)}`
    );
  }

  const compatibilityFixtures = await readJson("contracts/fixtures/downstream-compatibility-fixtures.json");

  if (!Array.isArray(compatibilityFixtures.consumers) || compatibilityFixtures.consumers.length === 0) {
    errors.push("downstream compatibility fixtures must list at least one consumer");
  } else {
    for (const consumer of compatibilityFixtures.consumers) {
      const required = consumer.requiredVersions ?? {};
      if (required.contractSchema !== versionMatches.CONTRACT_SCHEMA_VERSION) {
        errors.push(`${consumer.repository}: contractSchema must match CONTRACT_SCHEMA_VERSION`);
      }
      if (required.policyReasonCodes !== versionMatches.POLICY_REASON_CODES_VERSION) {
        errors.push(`${consumer.repository}: policyReasonCodes must match POLICY_REASON_CODES_VERSION`);
      }
      if (required.pr7UnifiedAsset !== versionMatches.PR7_UNIFIED_ASSET_SCHEMA_VERSION) {
        errors.push(`${consumer.repository}: pr7UnifiedAsset must match PR7_UNIFIED_ASSET_SCHEMA_VERSION`);
      }
      if (required.pr8Erc4337 !== versionMatches.PR8_ERC4337_SCHEMA_VERSION) {
        errors.push(`${consumer.repository}: pr8Erc4337 must match PR8_ERC4337_SCHEMA_VERSION`);
      }
      if (!Array.isArray(consumer.requiredChecks) || consumer.requiredChecks.length === 0) {
        errors.push(`${consumer.repository}: requiredChecks must not be empty`);
      }
    }
  }

  const compatibilityMatrixDoc = await readFile(path.join(rootDir, "docs/compatibility-matrix.md"), "utf8");
  for (const consumer of compatibilityFixtures.consumers ?? []) {
    if (!compatibilityMatrixDoc.includes(consumer.repository)) {
      errors.push(`docs/compatibility-matrix.md missing consumer row for ${consumer.repository}`);
    }
  }

  if (errors.length > 0) {
    console.error("Version consistency validation failed:\n");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Version consistency validation passed.");
}

await main();
