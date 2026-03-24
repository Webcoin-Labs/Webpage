# Webcoin Labs Founder OS Expansion: Implementation Status

Last updated: 2026-03-21

## Scope
This document tracks implementation status for:
- OpenClaw Telegram operations
- Tokenomics Studio (table editor + XLSX/CSV)
- Raise market + investor commitments
- Founder/Builder linked identity + investor-only contact visibility
- Hardening: migration safety, audit logs, retries, idempotency, validation, observability hooks

## Implemented
### Backend and Data
- Added schema entities for OpenClaw/Telegram, raise rounds, commitments, tokenomics, profile links.
- Added aggregate raise fields:
  - `RaiseRound.committedAmount`
  - `RaiseRound.interestedAmount`
  - `RaiseRound.coverageRatio`
- Added audit + revision entities:
  - `MutationAuditLog`
  - `TokenomicsScenarioRevision`
- Added telegram dedupe uniqueness key in schema (`threadId + externalMessageId`).

### Server Actions and APIs
- Founder OS expansion actions implemented and hardened:
  - OpenClaw connect/sync/reply
  - round create/update/progress/status
  - builder ask creation
  - investor commitment create/update
  - tokenomics create/upsert/import/export/rollback revision
  - contact visibility + profile linking
- Added internal job routes:
  - Telegram sync worker
  - queued tokenomics import worker
- Added protected investor-only contacts API:
  - `/api/profiles/contact/[username]`

### Security and Reliability
- Encrypted OpenClaw token storage at rest.
- Rate limiting for OpenClaw actions.
- Retry/backoff for OpenClaw API transport errors.
- OpenClaw token refresh path (refresh token flow).
- Idempotent Telegram message ingestion (`createMany + skipDuplicates`).
- Tokenomics validation checks:
  - non-negative values
  - total percent <= 100
  - cliff <= vesting
- Upload safety hook for sheet files (`UPLOAD_SCAN_HOOK_URL` optional).
- Structured telemetry hooks (`logEvent`, `logError`).
- Audit writes for sensitive mutations (rounds, commitments, tokenomics, contacts, profile linking).

### UI
- Founder OS:
  - OpenClaw panel
  - Raise Round Manager with status transitions + aggregate display
  - Tokenomics Studio table-style row editor + revision rollback selector
- Investor OS:
  - current active rounds with rollup metrics
  - filter controls (`stage`, `chain`, round size range, check-size fit only)
  - commitment create/update
- Public profile pages:
  - linked identity chips (“Also Founder” / “Also Builder”)
  - investor-only contact icon visibility
  - Telegram precedence logic via shared helper

## Remaining Engineering Work
### 1) Migration Reconciliation (Critical)
- Current migration history is inconsistent in this repo/environment chain.
- Added forward-safe SQL migration file:
  - `prisma/migrations/20260321133000_founder_os_expansion_hardening/migration.sql`
- Still required:
  - run against staging DB and verify no index/table conflicts
  - apply in production with rollback checkpoint
  - validate migration ordering with existing historical chain

### 2) OpenClaw Production Readiness
- Confirm real refresh endpoint contract with OpenClaw provider.
- Add integration tests for revoked token, refresh success/failure, timeout retry paths.
- Add scheduler policy (interval + max batch) for sync worker route.

### 3) Tokenomics UX and Validation Depth
- Current table editor is robust but static-row.
- Optional enhancement:
  - dynamic row add/remove client interaction
  - column mapping wizard UI for arbitrary CSV/XLSX headers
  - stricter supply-consistency validations across scenarios

### 4) Raise Market Advanced Signals
- Optional enhancement:
  - founder-side milestone tracking UI
  - investor-side sorting by coverage/velocity
  - investor notification targeting by thesis tags

### 5) Test Suite Coverage
- No formal test framework currently in this repo.
- Recommended:
  - add integration test runner (Playwright/Vitest + test DB)
  - cover critical server action mutation paths and auth boundaries

## Manual / Operational Tasks
### Accounts and Secrets
- Provision and verify:
  - `OPENCLAW_BASE_URL`
  - `OPENCLAW_API_KEY`
  - `APP_ENCRYPTION_SECRET`
  - `INTERNAL_JOBS_SECRET`
  - optional `UPLOAD_SCAN_HOOK_URL`
- Configure Telegram bot permissions and allowed chats/channels.

### Infrastructure
- Set scheduler for:
  - `/api/internal/jobs/openclaw-sync`
  - `/api/internal/jobs/tokenomics-import`
- Ensure log sink and alerts capture:
  - `openclaw_*_failed`
  - `tokenomics_*_failed`
  - rate-limit events
- Validate DB backup snapshot before applying migration SQL.

### QA / Product Ops
- Run persona UAT:
  - founder: round + tokenomics + Telegram flow
  - investor: filters + commitments + visibility checks
  - builder/founder cross-link contact visibility checks
- Verify anonymous users cannot access investor-only contact fields.

### Compliance
- Update privacy/terms for Telegram metadata processing.
- Define retention policy for synced Telegram message metadata and tokenomics upload payloads.

## Time Estimate
Assumption: 1 full-stack engineer, shared QA, part-time DevOps.

| Workstream | Effort | Calendar |
|---|---:|---:|
| Migration reconciliation + staging/prod runbook | 1.5–2.5 days | 2–3 days |
| OpenClaw hardening verification + provider contract checks | 1.5–2.5 days | 2–4 days |
| Tokenomics UX enhancements (optional dynamic mapper/editor) | 2–4 days | 3–6 days |
| Raise market enhancements (optional advanced ranking/milestones) | 1.5–3 days | 2–4 days |
| Test harness bootstrap + integration coverage | 2–4 days | 3–6 days |
| Manual ops + UAT + release checks | 2–3 days | 3–5 days |

### Total Remaining
- Core production close-out (without optional UX extras): **~8–13 engineering days**
- With optional UX + deeper test stack: **~12–20 engineering days**
- Expected elapsed timeline: **2–5 weeks** depending on external integration readiness and QA bandwidth.

## Acceptance Criteria
- Build and type checks pass in CI.
- Migration SQL applied in staging, validated, then promoted to production.
- OpenClaw connect/sync/reply stable with token refresh and proper failure handling.
- Tokenomics import/export round-trip and revision rollback verified.
- One active round per venture enforced in DB.
- Investor-only contact policy consistently enforced across UI + protected API.
- No regression in existing Founder/Builder/Investor workflows.
