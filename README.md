# Ryvra Protocol Core

**Status:** production baseline (GO for production RC cutover).
**Verification:** canonical alignment verification completed against `v0.2.1-contract-hardening`.
**Phase 2:** policy-risk and ledger-settlement real adapter boundaries implemented (deterministic + http modes).
**Phase 2c:** pay boundary hardening for callback/retry/reconciliation integrity completed. See [`docs/pay-boundary-hardening.md`](./docs/pay-boundary-hardening.md) and [`docs/reliability-scenarios-matrix.md`](./docs/reliability-scenarios-matrix.md).

Ryvra Protocol Core is the foundational specification surface for a protocol that combines:

- **Account Abstraction (EIP-4337)** for programmable user accounts and policy-based execution.
- **Unified Assets** for consistent asset representation across payment and market activity.
- **Proof of Transaction (PoT)** for contribution tracking that can support pre-TGE program accounting.

This repository is intentionally **docs-and-interfaces-first** with production-baseline interfaces, adapters, and operational runbooks.

## Thesis

Ryvra aims to unify the account and asset layers so every valid transaction can be policy-aware, settlement-safe, and contribution-visible. The objective is an institutional-grade core that can support both user simplicity and protocol-level accountability.

## Architecture Overview

Ryvra Protocol Core is organized around four cooperating layers:

1. **AA Account Layer**
   - EIP-4337-compatible smart account model
   - policy engine and session key controls
   - sponsor/paymaster integration points
2. **Unified Asset Layer**
   - canonical asset schema
   - normalization across payment and market flows
   - metadata and risk flags
3. **Ledger & Settlement Layer**
   - deterministic transaction intents and posting
   - finality-aware settlement reconciliation
   - auditable state transitions
4. **Contribution Layer (PoT)**
   - transaction contribution event model
   - scoring parameter hooks
   - anti-abuse and review controls

## Module Map

- [`docs/rfc-0001-aa-unified-assets.md`](./docs/rfc-0001-aa-unified-assets.md) — AA + Unified Assets production baseline requirements (v1)
- [`docs/tokenomics-proof-of-transaction.md`](./docs/tokenomics-proof-of-transaction.md) — pre-TGE PoT points framework
- [`docs/tokenomics-faq.md`](./docs/tokenomics-faq.md) — concise tokenomics FAQ
- [`docs/brand-narrative.md`](./docs/brand-narrative.md) — brand narrative and positioning
- [`contracts`](./contracts) — canonical cross-repo contract types and state vocabularies
- [`integration-sandbox`](./integration-sandbox) — deterministic mock-driven E2E flows
- [`docs/integration-sandbox-e2e.md`](./docs/integration-sandbox-e2e.md) — happy path, denied path, idempotency, and reconciliation coverage
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — contribution standards and RFC-first changes
- [`SECURITY.md`](./SECURITY.md) — responsible disclosure process

## RFC Index

- RFC-0001: AA + Unified Assets Core (production baseline) — [link](./docs/rfc-0001-aa-unified-assets.md)
- RFC-0002: APIs and SDK Surface (reserved for ratified publication)
- RFC-0003: PoT Scoring Parameters (reserved for ratified publication)

## Repository Baseline

- TypeScript + pnpm workspace with canonical contracts, adapters, and integration sandbox
- CI gates for docs linting, version consistency, typecheck, tests, and dependency security
- Production readiness and cutover artifacts under [`docs`](./docs)
