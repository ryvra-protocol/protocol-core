# Production Compatibility Baseline

- Canonical contract schema baseline: `1.0.0` (`contracts/src/version.ts`)
- Policy reason codes baseline: `1.0.0` (`contracts/src/version.ts`)
- Workspace package baseline: `0.1.0` for workspace packages (`package.json` + workspace package manifests)

## Organization repository production baseline requirements

| Repository | Required `protocol-core` contract/schema baseline | Required policy reason code baseline | Status |
| --- | --- | --- | --- |
| `ryvra-protocol/pay` | `1.0.0` | `1.0.0` | PARTIAL (manual confirmation required in consumer repo CI) |
| `ryvra-protocol/markets` | `1.0.0` | `1.0.0` | PARTIAL (manual confirmation required in consumer repo CI) |
| `ryvra-protocol/policy-risk` | `1.0.0` | `1.0.0` | PARTIAL (adapter-aligned here; downstream repo confirmation still required) |
| `ryvra-protocol/ledger-settlement` | `1.0.0` | `1.0.0` | PARTIAL (adapter-aligned here; downstream repo confirmation still required) |
| `ryvra-protocol/accounts` | `1.0.0` | `1.0.0` | PARTIAL (manual confirmation required in consumer repo CI) |
| `ryvra-protocol/asset-registry` | `1.0.0` | `1.0.0` | PARTIAL (manual confirmation required in consumer repo CI) |
| `ryvra-protocol/website` | `1.0.0` | `1.0.0` | PARTIAL (docs/API references must be validated in website pipeline) |
| `ryvra-protocol/docs` | `1.0.0` | `1.0.0` | PARTIAL (docs snapshot update required) |

## Verification command

Run:

```bash
pnpm validate:versions
```

This validates:

- root/workspace package version consistency,
- pnpm toolchain pin consistency,
- canonical contract schema constants follow semver format.
