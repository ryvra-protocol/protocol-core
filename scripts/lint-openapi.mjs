import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const contractPath = path.join(rootDir, "openapi/points-tasks.openapi.yaml");

const REQUIRED_GET_PATHS = [
  "/points-tasks/points/entries",
  "/points-tasks/points/summary",
  "/points-tasks/points/overview",
  "/points-tasks/tasks",
  "/points-tasks/tasks/summary",
  "/points-tasks/tasks/overview",
  "/points-tasks/status",
  "/points-tasks/status/health"
];

const REQUIRED_ENUM_SCHEMAS = [
  "PointEntryType",
  "PointEntryStatus",
  "PointEntrySource",
  "TaskType",
  "TaskStatus",
  "TaskProgressState"
];

const REQUIRED_LIST_PATHS = ["/points-tasks/points/entries", "/points-tasks/tasks"];

const errors = [];

const pushError = (message) => errors.push(message);

const asObject = (value) => (typeof value === "object" && value !== null ? value : null);

const resolveParameter = (spec, parameterOrRef) => {
  const parameter = asObject(parameterOrRef);
  if (!parameter) {
    return null;
  }

  if (typeof parameter.$ref === "string") {
    const match = parameter.$ref.match(/^#\/components\/parameters\/(.+)$/);
    if (!match) {
      return null;
    }
    return asObject(spec?.components?.parameters?.[match[1]]);
  }

  return parameter;
};

const getOperation = (spec, route, method) => asObject(spec?.paths?.[route]?.[method]);

const hasParameter = (spec, operation, name) => {
  const params = Array.isArray(operation?.parameters) ? operation.parameters : [];
  for (const parameterOrRef of params) {
    const parameter = resolveParameter(spec, parameterOrRef);
    if (parameter?.name === name) {
      return parameter;
    }
  }
  return null;
};

async function main() {
  const source = await readFile(contractPath, "utf8");

  let spec;
  try {
    spec = load(source);
  } catch (error) {
    console.error(`OpenAPI parse failed for ${contractPath}:`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const parsedSpec = asObject(spec);
  if (!parsedSpec) {
    pushError("Root document must be a YAML object.");
  }

  if (typeof parsedSpec?.openapi !== "string" || !parsedSpec.openapi.startsWith("3.")) {
    pushError("`openapi` must be a 3.x version string.");
  }

  if (!asObject(parsedSpec?.info) || typeof parsedSpec.info.version !== "string") {
    pushError("`info.version` must be set.");
  }

  if (!asObject(parsedSpec?.paths)) {
    pushError("`paths` must be present.");
  }

  for (const route of REQUIRED_GET_PATHS) {
    const operation = getOperation(parsedSpec, route, "get");
    if (!operation) {
      pushError(`Missing GET ${route}`);
      continue;
    }

    if (!asObject(operation.responses) || !operation.responses["200"]) {
      pushError(`GET ${route} must define a 200 response.`);
    }
  }

  for (const route of REQUIRED_LIST_PATHS) {
    const operation = getOperation(parsedSpec, route, "get");
    if (!operation) {
      continue;
    }

    const cursor = hasParameter(parsedSpec, operation, "cursor");
    const limit = hasParameter(parsedSpec, operation, "limit");
    const page = hasParameter(parsedSpec, operation, "page");

    if (!cursor) {
      pushError(`GET ${route} must include a cursor parameter.`);
    }

    if (!limit) {
      pushError(`GET ${route} must include a limit parameter.`);
    }

    if (!page) {
      pushError(`GET ${route} must include deprecated page compatibility parameter.`);
    } else if (page.deprecated !== true) {
      pushError(`GET ${route} page parameter must be marked deprecated.`);
    }
  }

  const schemas = asObject(parsedSpec?.components?.schemas);
  if (!schemas) {
    pushError("`components.schemas` must be present.");
  } else {
    for (const schemaName of REQUIRED_ENUM_SCHEMAS) {
      const schema = asObject(schemas[schemaName]);
      if (!schema || !Array.isArray(schema.enum) || schema.enum.length === 0) {
        pushError(`Schema ${schemaName} must define a non-empty enum.`);
      }
    }

    const errorEnvelope = asObject(schemas.ErrorEnvelope);
    const requiredFields = Array.isArray(errorEnvelope?.required) ? errorEnvelope.required : [];
    for (const field of ["code", "message", "retryable", "source"]) {
      if (!requiredFields.includes(field)) {
        pushError(`ErrorEnvelope.required must include ${field}.`);
      }
    }
  }

  const securityScheme = asObject(parsedSpec?.components?.securitySchemes?.bearerAuth);
  if (!securityScheme || securityScheme.type !== "http" || securityScheme.scheme !== "bearer") {
    pushError("components.securitySchemes.bearerAuth must be an HTTP bearer auth scheme.");
  }

  const healthOperation = getOperation(parsedSpec, "/points-tasks/status/health", "get");
  if (!healthOperation) {
    pushError("GET /points-tasks/status/health is required.");
  } else if (!Array.isArray(healthOperation.security) || healthOperation.security.length !== 0) {
    pushError("GET /points-tasks/status/health must declare `security: []`.");
  }

  if (errors.length > 0) {
    console.error("OpenAPI contract lint failed:\n");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("OpenAPI contract lint passed.");
}

await main();
