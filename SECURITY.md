# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately to repository maintainers before any public disclosure.

Include:

- affected component(s),
- reproduction steps,
- impact assessment,
- suggested remediation (if available),
- whether exploitation is known or suspected in the wild.

Do not publicly post exploit details until a fix or mitigation plan is in place.

## Triage model

Severity is triaged using a standard high-level model:

- **Critical:** immediate risk to funds, account control, or protocol integrity.
- **High:** significant security weakness with realistic exploitability.
- **Medium:** meaningful weakness with constrained exploit conditions.
- **Low:** limited impact or defense-in-depth issue.

## SLA and response expectations

- Initial acknowledgement:
  - Critical/High: within 24 hours
  - Medium/Low: within 72 hours
- Severity assignment target:
  - Critical/High: within 48 hours
  - Medium/Low: within 5 business days
- Remediation plan target:
  - Critical: within 48 hours of triage
  - High: within 5 business days of triage
  - Medium/Low: in the next scheduled maintenance cycle unless risk requires earlier action

## Coordinated response process

1. Intake and acknowledge report.
2. Assign severity and incident owner.
3. Define mitigation/remediation plan and timeline.
4. Validate fix and release with required CI/security checks.
5. Coordinate disclosure timing with reporter when applicable.

For incident execution workflow, use `docs/incident-response-template.md`.
