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
