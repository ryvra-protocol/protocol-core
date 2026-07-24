# @ryvra/contracts

Canonical cross-repo protocol contracts and state vocabularies for deterministic integration flows.

## Compatibility and versioning

- Baseline tag for cross-repo rollout: `v0.2.1-contract-hardening`.
- `CONTRACT_SCHEMA_VERSION`: version for canonical interfaces/enums.
- `POLICY_REASON_CODES_VERSION`: version for reason-code taxonomy.
- Backward-compatible additions can be introduced as optional fields and appended enum/code values.
- Breaking changes require a version bump and coordinated rollout across dependent repositories.

## Adoption guidance for module repositories

- Prefer direct imports from `@ryvra/contracts` once published.
- If publication is not yet available, use a local compatibility layer that mirrors these contracts exactly.
- Compatibility layer files should include: `TODO(protocol-core-v0.2.1-contract-hardening): switch local compatibility types to published @ryvra/contracts`.
