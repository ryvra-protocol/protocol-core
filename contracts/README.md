# @ryvra/contracts

Canonical cross-repo protocol contracts and state vocabularies for deterministic integration flows.

## Compatibility and versioning

- Baseline tag for cross-repo rollout: `v0.2.1-contract-hardening`.
- `CONTRACT_SCHEMA_VERSION`: version for canonical interfaces/enums.
- `POLICY_REASON_CODES_VERSION`: version for reason-code taxonomy.
- `PR7_UNIFIED_ASSET_SCHEMA_VERSION`: version for PR7 unified-asset schema boundary.
- `PR8_ERC4337_SCHEMA_VERSION`: version for PR8 ERC-4337 schema boundary.
- Freeze manifest for H4 hardening: `contracts/freeze/contract-freeze.json`.
- Backward-compatible additions can be introduced only as optional fields and appended enum/code values.
- Breaking changes require a major version bump and coordinated rollout across dependent repositories.

## Contract semver/change policy

- Patch updates (`x.y.z+1`) are limited to implementation/docs/test fixes and must not alter export surface or contract field shapes.
- Minor updates (`x.y+1.0`) are additive-only and must include:
  - updates to `contracts/freeze/contract-freeze.json` change policy references,
  - updates to `contracts/fixtures/schema-snapshot.v1.json` and compatibility fixtures,
  - updated `docs/compatibility-matrix.md` enforcement evidence.
- Major updates (`x+1.0.0`) are required for any breaking field removal/rename/type tightening or export-surface removal and require downstream signoff before merge.

## Adoption guidance for module repositories

- Prefer direct imports from `@ryvra/contracts` once published.
- If publication is not yet available, use a local compatibility layer that mirrors these contracts exactly.
- Compatibility layer files should include: `TODO(protocol-core-v0.2.1-contract-hardening): switch local compatibility types to published @ryvra/contracts`.

## Unified asset mapping guidance (PR7)

- Canonical identifier remains `asset_id` (`AssetId`) and should be the only join key used across pay, policy, ledger, and contribution events.
- For chain-specific resolution, map local chain/token metadata into `chain_asset_ref` (`chain_id`, optional `contract_ref`, optional `token_standard`) without replacing `asset_id`.
- Represent balances and exposures with `CanonicalAmount` (`amount_minor`, `amount_decimal`, `decimals`) to avoid precision drift between integer and decimal representations.
- Keep local/provider aliases in adapter-owned metadata only; do not introduce alias ids into canonical contracts.

## PR7 versioning and migration notes

- `PR7_UNIFIED_ASSET_SCHEMA_VERSION` tags the unified-asset contract surface introduced in PR7.
- Existing contracts remain additive and backward compatible; no prior field names were removed or repurposed.
- Consuming repositories can migrate incrementally by:
  - adding `UnifiedAsset` alongside existing `asset_id` usage,
  - adopting `CanonicalAmount` in new balance/exposure payloads first,
  - then standardizing on `UnifiedBalance`, `AssetPosition`, and `ExposureSnapshot` for cross-module snapshots.

## PR8 interface ownership (ERC-4337 boundaries)

- `protocol-core` owns canonical cross-repo ERC-4337 boundary contracts only (`CanonicalUserOperation`, `SmartAccountRef`, `EntryPointRef`, `BundlerRef`, `PaymasterRef`, `SponsorshipPolicy*`, `UserOperationSimulationResult`, `userop.*` event payload contracts).
- Execution/orchestration implementations (bundler clients, paymaster RPC implementations, product-specific flow state machines) remain owned by consumer repositories and are out of scope for this package.
- Consumer repos should treat these contracts as shared schema and keep transport/provider-specific fields in adapter-local metadata.

## PR8 compatibility and migration notes

- `PR8_ERC4337_SCHEMA_VERSION` tags the additive ERC-4337 boundary contract surface introduced in PR8.
- Existing schema constants remain valid; PR8 introduces new exports and does not remove or repurpose prior fields.
- Migration path for consumers:
  - adopt canonical reference contracts (`*Ref`) first,
  - map local UserOperation structures into `CanonicalUserOperation`,
  - emit canonical `userop.submitted/simulated/included/failed/finalized` payload shapes while preserving local execution logic.
