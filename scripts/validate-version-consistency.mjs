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

const semverPattern = /^\d+\.\d+\.\d+$/;

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
  const schemaMatch = versionSource.match(/CONTRACT_SCHEMA_VERSION\s*=\s*"([^"]+)"/);
  const policyMatch = versionSource.match(/POLICY_REASON_CODES_VERSION\s*=\s*"([^"]+)"/);

  if (!schemaMatch) {
    errors.push("contracts/src/version.ts missing CONTRACT_SCHEMA_VERSION");
  } else if (!semverPattern.test(schemaMatch[1])) {
    errors.push(`CONTRACT_SCHEMA_VERSION must be semver, received: ${schemaMatch[1]}`);
  }

  if (!policyMatch) {
    errors.push("contracts/src/version.ts missing POLICY_REASON_CODES_VERSION");
  } else if (!semverPattern.test(policyMatch[1])) {
    errors.push(`POLICY_REASON_CODES_VERSION must be semver, received: ${policyMatch[1]}`);
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
