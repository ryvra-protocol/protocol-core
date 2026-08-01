# RFC-0001: Account Abstraction + Unified Assets Core (v1 Production Baseline)

- **Status:** Ratified (Production Baseline)
- **Authors:** Ryvra Protocol Core Contributors
- **Last Updated:** 2026-08-01

## 1. Scope and Motivation

This RFC defines the foundational requirements for Ryvra's account abstraction and unified asset model. The objective is to establish a shared production baseline for interface design, security posture, and settlement behavior.

Ryvra requires a common core that:

- enables programmable account behavior aligned with EIP-4337,
- represents assets consistently across pay and market interactions,
- and produces verifiable contribution events for Proof of Transaction (PoT).

This RFC is implementation-normative where required and interface-first where modularity is required.

## 2. EIP-4337 Account Abstraction Requirements

The AA layer SHOULD satisfy the following:

1. **EIP-4337 Compatibility**
   - Support UserOperation-oriented execution flows.
   - Integrate with EntryPoint-compatible validation and execution semantics.
2. **Validation Modularity**
   - Account validation logic MUST be policy-extensible.
   - Signature schemes and authorization modules SHOULD be replaceable under governance controls.
3. **Sponsorship and Fee Handling**
   - Paymaster-compatible hooks SHOULD be supported.
   - Fee behavior MUST be transparent in account and ledger records.
4. **Replay and Domain Separation**
   - Nonce and domain models MUST prevent replay across chains, contexts, and policy scopes.

## 3. Session Key Policy Model

Session keys enable constrained delegated execution while preserving account-level safety.

### Policy primitives

A session key policy SHOULD include:

- principal account reference,
- delegate key reference,
- allowed methods/intents,
- spend or exposure limits,
- asset allow/deny lists,
- destination constraints,
- validity window (`notBefore`, `notAfter`),
- revocation handle.

### Enforcement requirements

- Policies MUST be evaluated before execution.
- Violations MUST fail closed.
- Policy decisions SHOULD be evented for auditability.
- Revocation MUST be low-latency and finality-aware.

## 4. Unified Asset Schema

Ryvra defines a canonical unified asset schema to reduce fragmentation across subsystems.

### Core fields

- `assetId`: canonical asset identifier
- `assetType`: native, tokenized, derivative, or program-defined class
- `chainId` and `contractRef` (when relevant)
- `decimals` and normalized quantity format
- `settlementClass`: immediate, delayed, conditional
- `riskFlags`: optional controls (e.g., restricted, review-required)
- `metadataRef`: optional off-chain metadata pointer

### Schema requirements

- Asset records MUST be deterministic and versioned.
- Quantity representation MUST avoid precision ambiguity.
- Cross-module usage MUST rely on canonical identifiers, not ad hoc aliases.

## 5. Ledger and Settlement Requirements

The ledger/settlement layer SHOULD provide:

- deterministic intent recording,
- ordered state transition logs,
- finality-sensitive settlement states,
- reversible handling where protocol rules permit,
- reconciliation hooks for accounting and audit.

Minimum settlement states:

1. `pending`
2. `accepted`
3. `settled`
4. `rejected`
5. `reversed` (policy-bound)

All transitions MUST be attributable to an actor, system condition, or governance-approved process.

## 6. PoT Contribution Event Model

PoT is event-driven. The core emits contribution events linked to valid transaction outcomes.

### Event envelope

- `eventId`
- `timestamp`
- `accountRef`
- `txRef` (or deterministic operation reference)
- `assetContext`
- `actionClass`
- `qualitySignals` (optional)
- `abuseFlags` (optional)
- `scoreInputsRef` (for parameterized scoring systems)

### Event requirements

- Events MUST be idempotent and deduplicatable.
- Events MUST be tied to settled or policy-accepted outcomes.
- Events SHOULD support replay-safe downstream scoring.

## 7. Security and Anti-Abuse Considerations

The protocol MUST prioritize abuse resistance from the outset.

Key controls include:

- sybil-resistance hooks and account-linkage risk signals,
- wash-pattern detection inputs,
- rate limits and dynamic thresholds,
- session key blast-radius controls,
- anomaly monitoring for contribution inflation.

Security scope includes smart account validation, policy engine bypass risk, ledger integrity, and contribution event forgery risks. All production security decisions remain subject to dedicated threat modeling and legal/compliance review where applicable.

## 8. Open Questions (for next RFCs)

- RFC-0002: standard API/SDK surfaces for account policy and asset interfaces.
- RFC-0003: normative PoT scoring parameterization and governance process.
