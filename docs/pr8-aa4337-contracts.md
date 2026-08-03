# PR8 ERC-4337 Canonical Contracts

## Cross-repo interface ownership

- `protocol-core/contracts` owns the canonical schema surface for ERC-4337 boundaries and event payload contracts.
- Account/bundler/paymaster implementations remain owned by consuming repositories.
- Runtime execution/orchestration and provider client integrations are intentionally out of scope for this repository.

Owned canonical contracts (PR8):

- `CanonicalUserOperation` (chain-aware deterministic fields)
- `SmartAccountRef`, `EntryPointRef`, `BundlerRef`, `PaymasterRef`
- `SponsorshipPolicyInput`, `SponsorshipPolicyDecision`
- `UserOperationSimulationResult` + simulation outcome taxonomy
- `UserOperationLifecycleStatus` + replay/idempotency surface
- Canonical `userop.submitted`, `userop.simulated`, `userop.included`, `userop.failed`, `userop.finalized` payload contracts

## Compatibility and migration notes

- `PR8_ERC4337_SCHEMA_VERSION` tags the PR8 additive schema surface.
- PR8 is additive and non-breaking relative to current contracts (`CONTRACT_SCHEMA_VERSION` and PR7 constants remain unchanged).
- Consumer migration order:
  1. replace local ad hoc account/paymaster/bundler references with `*Ref` contracts,
  2. normalize local user operation objects to `CanonicalUserOperation`,
  3. align emitted events to canonical `userop.*` payload contracts,
  4. keep orchestration/runtime clients in consumer repos.
