# Cross-Repo Cutover Tracker

Protocol baseline source: `docs/compatibility-matrix.md`  
Target contract/schema baseline: `1.0.0`

| Repository | Target contract/schema version | Compatibility status (GREEN/YELLOW/RED) | Blocker | Owner role | ETA |
| --- | --- | --- | --- | --- | --- |
| `pay` | `1.0.0` | YELLOW | Stablecoin rail dependency validation and settlement confirmation still pending | Pay Integration Owner | 2026-08-02 |
| `markets` | `1.0.0` | YELLOW | **Uniswap-first dependency** validation pending for production route enablement | Markets Integration Owner | 2026-08-03 |
| `policy-risk` | `1.0.0` | GREEN | None reported from protocol-core compatibility baseline | Policy-Risk Owner | 2026-08-01 |
| `ledger-settlement` | `1.0.0` | GREEN | None reported from protocol-core compatibility baseline | Ledger Settlement Owner | 2026-08-01 |
| `accounts` | `1.0.0` | YELLOW | Consumer-side schema contract check not yet linked | Accounts Owner | 2026-08-02 |
| `asset-registry` | `1.0.0` | YELLOW | Consumer-side schema contract check not yet linked | Asset Registry Owner | 2026-08-02 |
| `website` | `1.0.0` | YELLOW | Public API/docs reference update validation pending in website pipeline | Website Owner | 2026-08-03 |
| `docs` | `1.0.0` | YELLOW | Docs snapshot/update PR pending merge confirmation | Docs Owner | 2026-08-02 |

## Update procedure

1. For each repo, attach latest CI/job link proving schema compatibility.
2. Set status to GREEN only when evidence links are attached and reviewed.
3. Escalate any RED item in the go/no-go issue before production decision.
