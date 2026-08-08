# API Contract Changelog

## 2026-08-08 — Points/Tasks contract `2026-08-08.v1`

- Published canonical OpenAPI contract: [`openapi/points-tasks.openapi.yaml`](../openapi/points-tasks.openapi.yaml).
- Canonicalized endpoint paths for Points, Tasks, and status/health surfaces.
- Defined pagination/filter/sort behavior, including cursor-first pagination and deprecated `page` compatibility handling.
- Defined canonical enums for points entry type/status/source and task type/status/progress state.
- Defined canonical error envelope (`code`, `message`, `retryable`, `source`, optional `details`).
- Defined auth/header/scope requirements, including `x-request-id` and `x-correlation-id` tracing metadata.
- Defined compatibility policy and deprecation windows:
  - Additive changes only within the current version family.
  - Breaking changes require a new version marker and migration notes.
  - Deprecations require at least 180 days and two minor contract revisions before removal.
- Documented tracking issue URL for contract updates:
  - <https://github.com/ryvra-protocol/protocol-core/issues/new?title=Points%2FTasks%20API%20contract%20updates>
