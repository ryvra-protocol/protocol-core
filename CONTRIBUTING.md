# Contributing to Ryvra Protocol Core

Thank you for contributing.

## Contribution Principles

- Keep changes scoped, reviewable, and well-documented.
- Prioritize specification quality and interface clarity.
- Treat security and abuse resistance as first-order concerns.

## RFC-First Requirement for Major Changes

Major design or behavior changes MUST begin with an RFC proposal before implementation.

Examples:

- account model or validation changes,
- unified asset schema changes,
- settlement state machine changes,
- PoT scoring model changes.

## Pull Request Standards

Each PR should include:

1. Problem statement and motivation.
2. Summary of changes.
3. Scope boundaries and non-goals.
4. Validation notes (lint/tests/manual checks as applicable).
5. Follow-up items, if any.

## Commit Conventions

Use conventional-style commit prefixes where possible:

- `feat:` for new functionality/spec surfaces
- `fix:` for corrections
- `docs:` for documentation changes
- `chore:` for maintenance/setup tasks
- `refactor:` for structural improvements without behavior changes

## Review Expectations

- At least one reviewer approval is recommended for non-trivial changes.
- Security-sensitive changes require explicit reviewer attention.
- Keep PRs small and focused to accelerate review quality.
