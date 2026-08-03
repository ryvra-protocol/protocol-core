# Production Compatibility Baseline

- Canonical contract schema baseline: `1.0.0` (`contracts/src/version.ts`)
- Policy reason codes baseline: `1.0.0` (`contracts/src/version.ts`)
- PR7 unified-asset schema baseline: `1.0.0-pr7` (`contracts/src/version.ts`)
- PR8 ERC-4337 boundary schema baseline: `1.0.0-pr8` (`contracts/src/version.ts`)
- Workspace package baseline: `0.1.0` for workspace packages (`package.json` + workspace package manifests)
- Freeze manifest: `contracts/freeze/contract-freeze.json`
- Downstream compatibility fixture: `contracts/fixtures/downstream-compatibility-fixtures.json`

## Organization repository production baseline requirements

| Repository | Required `protocol-core` contract/schema baseline | Required policy reason code baseline | Required PR7 unified-asset schema baseline | Required PR8 ERC-4337 boundary schema baseline | Status |
| --- | --- | --- | --- | --- | --- |
| `ryvra-protocol/pay` | `1.0.0` | `1.0.0` | `1.0.0-pr7` | `1.0.0-pr8` | CORE-ENFORCED + CONSUMER-CI REQUIRED |
| `ryvra-protocol/markets` | `1.0.0` | `1.0.0` | `1.0.0-pr7` | `1.0.0-pr8` | CORE-ENFORCED + CONSUMER-CI REQUIRED |
| `ryvra-protocol/policy-risk` | `1.0.0` | `1.0.0` | `1.0.0-pr7` | `1.0.0-pr8` | CORE-ENFORCED + CONSUMER-CI REQUIRED |
| `ryvra-protocol/ledger-settlement` | `1.0.0` | `1.0.0` | `1.0.0-pr7` | `1.0.0-pr8` | CORE-ENFORCED + CONSUMER-CI REQUIRED |
| `ryvra-protocol/accounts` | `1.0.0` | `1.0.0` | `1.0.0-pr7` | `1.0.0-pr8` | CORE-ENFORCED + CONSUMER-CI REQUIRED |
| `ryvra-protocol/asset-registry` | `1.0.0` | `1.0.0` | `1.0.0-pr7` | `1.0.0-pr8` | CORE-ENFORCED + CONSUMER-CI REQUIRED |
| `ryvra-protocol/website` | `1.0.0` | `1.0.0` | `1.0.0-pr7` | `1.0.0-pr8` | CORE-ENFORCED + CONSUMER-CI REQUIRED |
| `ryvra-protocol/docs` | `1.0.0` | `1.0.0` | `1.0.0-pr7` | `1.0.0-pr8` | CORE-ENFORCED + CONSUMER-CI REQUIRED |

## Compatibility enforcement controls

- `scripts/validate-version-consistency.mjs` fails CI if:
  - frozen canonical versions in `contracts/freeze/contract-freeze.json` drift,
  - `contracts/src/index.ts` export surface changes,
  - downstream fixture versions/check requirements drift,
  - this matrix omits a consumer repository listed in the fixture.
- `contracts/test/downstream-compatibility.spec.ts` validates consumer fixture conformance at test time.
- `contracts/test/schema-snapshot.spec.ts` validates deterministic schema snapshots for canonical fields/events/enums.

## Verification command

Run:

```bash
pnpm validate:versions
```

This validates:

- root/workspace package version consistency,
- pnpm toolchain pin consistency,
- canonical contract schema constants follow semver format,
- frozen version/export-surface policy is intact,
- downstream compatibility fixture and matrix consistency.
