import { execSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const REQUIRED_FILES = [
  "CHANGELOG.md",
  "docs/production-ready-checklist.md",
  "docs/compatibility-matrix.md",
  "docs/cross-repo-cutover-tracker.md"
];

function log(message) {
  console.log(`[release:rc:check] ${message}`);
}

async function ensureFilesExist() {
  for (const relativePath of REQUIRED_FILES) {
    await access(path.join(rootDir, relativePath));
    log(`Found required file: ${relativePath}`);
  }
}

async function validateChangelogTopEntry() {
  const changelog = await readFile(path.join(rootDir, "CHANGELOG.md"), "utf8");
  const lines = changelog
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const firstHeading = lines.find((line) => line.startsWith("## "));
  if (!firstHeading || !firstHeading.toLowerCase().includes("release candidate")) {
    throw new Error("CHANGELOG.md top entry must be a release candidate heading.");
  }

  log(`Validated changelog top entry: ${firstHeading}`);
}

async function validateChecklistMarkers() {
  const checklist = await readFile(path.join(rootDir, "docs/production-ready-checklist.md"), "utf8");
  const hasCriticalTodo = /CRITICAL\s+TODO/i.test(checklist);

  if (hasCriticalTodo) {
    throw new Error("docs/production-ready-checklist.md contains unresolved CRITICAL TODO markers.");
  }

  log("No unresolved CRITICAL TODO markers found in production-ready checklist.");
}

function reportWorkingTreeStatus() {
  let statusOutput = "";
  try {
    statusOutput = execSync("git status --porcelain", { cwd: rootDir, encoding: "utf8" }).trim();
  } catch {
    log("Unable to read git working tree status in this environment. Continue with manual check.");
    return;
  }

  if (statusOutput.length > 0) {
    log("Working tree is not clean. For tag cutover, run this check from a clean tree and committed candidate SHA.");
  } else {
    log("Working tree is clean.");
  }
}

async function main() {
  log("Starting dry-run release candidate tag readiness checks.");
  log("Assumption: run from release candidate commit with clean working tree (`git status --short` should be empty).");

  await ensureFilesExist();
  await validateChangelogTopEntry();
  await validateChecklistMarkers();
  reportWorkingTreeStatus();

  log("RC tag readiness checks passed.");
}

main().catch((error) => {
  console.error(`[release:rc:check] Failed: ${error.message}`);
  process.exit(1);
});
