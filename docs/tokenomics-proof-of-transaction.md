# Tokenomics Draft: Proof of Transaction (Pre-TGE Points Program)

## Status and Purpose

This document defines an initial pre-TGE points framework for Proof of Transaction (PoT). Points are intended as program accounting units for contribution tracking, not as a token representation.

> **Important:** This framework is preliminary, subject to legal review, and may change before any formal token generation process.

## 1. Pre-TGE Points System

### 1.1 Base daily cap

- Initial cap: **2 points per account per day**.
- Cap applies to net eligible contribution under protocol rules.
- Eligibility depends on valid, non-abusive transaction behavior.

### 1.2 Epoch-based cap decay

- The daily cap **halves proportionally by epoch**.
- Draft illustrative schedule:
  - Epoch 0: 2.00 points/day
  - Epoch 1: 1.00 points/day
  - Epoch 2: 0.50 points/day
  - Epoch 3: 0.25 points/day
- Exact epoch length and transition cadence are governance parameters and will be finalized in RFC-0003.

## 2. Q4 2026 TGE Conversion Framework (Draft)

If a TGE is approved, a proportional conversion framework is expected:

1. Determine each eligible participant's final verified points.
2. Compute participant share as:

   `participant_points / total_verified_points`

3. Allocate the designated program portion proportionally to that share.

No token amount, valuation, or price is implied by this document. Any conversion framework is subject to legal review, compliance constraints, and final governance approval.

## 3. Anti-Sybil and Wash Controls

To preserve program integrity, the protocol may apply:

- identity and behavior-based risk scoring,
- linked-account clustering and suppression,
- wash-pattern detection and exclusion,
- cooldown periods and velocity constraints,
- retroactive invalidation for confirmed abuse.

Accounts or events flagged for abuse may receive reduced, delayed, or zero credited points pending review.

## 4. Program Disclaimers

- Points are **pre-TGE program units only**.
- Points are **not** ownership, equity, debt, or guaranteed claim rights.
- Points are **not** transferable unless explicitly specified in future policy.
- Final treatment remains subject to legal review and governance approval.
