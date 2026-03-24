# Security Audit Mitigations

Last updated: 2026-03-21

## Scope
- Command baseline: `pnpm audit --prod`
- Objective: no unresolved `high` vulnerabilities.

## Current Mitigations and Owners

### Runtime framework advisories (`next`)
- Status: mitigated by upgrading from `14.2.29` to `15.5.14`.
- Owner: Platform/App owner.
- Validation: run `pnpm audit --prod --audit-level=high` in CI and on release branch before deploy.

### XML parser advisories (`fast-xml-parser` transitively through AWS SDK)
- Status: mitigated by upgrading `@aws-sdk/client-s3` to latest release in this repo.
- Owner: Platform/App owner.
- Validation: confirmed through `pnpm audit --prod` after lockfile refresh.

### Sheet parsing advisories (`xlsx`)
- Status: mitigated by removing `xlsx` and replacing tokenomics sheet handling with `exceljs` + `csv-parse`.
- Owner: Founder OS owner.
- Validation: tokenomics import/export tests and manual UAT in staging.

## Remaining Moderate/Low Policy
- Any non-high findings that remain after dependency updates require:
  - documented package/version/advisory ID
  - exploitability assessment for this deployment
  - remediation target date
  - explicit owner assignment
