# Webcoin Labs - Staging/Production Launch Runbook

Last updated: 2026-03-16

This runbook is the execution guide for remaining external tasks:
- target-environment migrations
- runtime R2 validation
- final E2E/security regression checks

---

## 0) Release Roles

- **Release owner**: drives go/no-go and timestamps each gate.
- **DB owner**: runs migrations and validates Prisma client compatibility.
- **App owner**: deploys app and runs smoke tests.
- **Ops owner**: validates storage, logs, and job drain scheduling.

---

## 1) Go/No-Go Gate A (Preflight)

All must be true before touching staging/prod:

- Local build passes:
  - `pnpm prisma generate`
  - `pnpm tsc --noEmit`
  - `pnpm build`
- `.env.example` deltas reviewed and copied to target platform env:
  - storage: `STORAGE_PROVIDER`, `R2_*`
  - ai: `GEMINI_*`, `PITCH_ANALYSIS_QUEUE_MODE`
  - scale/ops: `UPSTASH_REDIS_REST_*`, `OBSERVABILITY_SINK_*`
  - jobs: `INTERNAL_JOBS_SECRET`, `EVENT_REMINDER_WEBHOOK_*`
- Admin test account exists in target DB.
- DB snapshot/backup created.

If any item is false: **STOP** and resolve.

---

## 2) Staging Deployment Steps

### 2.1 Apply DB migrations (staging)

Run in staging deployment shell:

```bash
pnpm prisma migrate deploy
pnpm prisma generate
```

Validation:
- command exits `0`
- no pending migration warnings

### 2.2 Deploy staging app

- Deploy current branch/commit to staging.
- Confirm app boot has no env validation failures.

### 2.3 Run internal background drain endpoint (staging)

Use a secure caller with the internal secret header:

```bash
curl -X POST "https://<staging-domain>/api/internal/jobs/drain" \
  -H "x-webcoinlabs-job-secret: <INTERNAL_JOBS_SECRET>"
```

Validation:
- response `200`
- JSON includes `success: true`
- both `pitch` and `reminders` objects present

---

## 3) Staging Verification Matrix (Must Pass)

## 3.1 Storage + media

1. Upload avatar, then replace avatar.
2. Upload founder logo, then replace logo.
3. Upload PDF pitch deck and DOCX pitch deck.
4. Retry failed/queued analysis from UI.

Expected:
- uploads persist
- replaced media no longer serves stale object
- analysis status transitions: `QUEUED` -> `EXTRACTING` -> `ANALYZING` -> `COMPLETED` (or clear `FAILED` with retry)

## 3.2 Admin visibility

Verify records appear in:
- `/app/admin/leads`
- `/app/admin/pitch-decks`
- `/app/admin/uploads`
- `/app/admin/jobs`
- `/app/admin/hiring-interests`
- `/app/admin/storage`

Run storage health check in `/app/admin/storage`:
- expected upload/read/delete success

## 3.3 Moderation UX

In `/app/admin/uploads`:
- single-row actions work
- bulk actions work on multiple rows
- timeline panel shows full moderation log history

## 3.4 Security/RBAC

Verify non-admin account cannot access or execute:
- admin pages
- moderation actions
- internal privileged actions

## 3.5 Headers

Check response headers in staging:
- `Content-Security-Policy`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Strict-Transport-Security` (prod-only expectation; optional in staging)

---

## 4) Go/No-Go Gate B (Promote to Production)

Promote only if all are true:
- staging verification matrix passed
- no P0/P1 errors in logs during test window
- upload/analysis failure rate acceptable
- release owner sign-off recorded

If any fail: fix and re-run staging matrix.

---

## 5) Production Deployment Steps

### 5.1 Apply DB migrations (production)

```bash
pnpm prisma migrate deploy
pnpm prisma generate
```

### 5.2 Deploy production app

- deploy same validated artifact/commit from staging
- verify health/load routes respond

### 5.3 Trigger drain endpoint once post-deploy

```bash
curl -X POST "https://<production-domain>/api/internal/jobs/drain" \
  -H "x-webcoinlabs-job-secret: <INTERNAL_JOBS_SECRET>"
```

### 5.4 Configure recurring drain schedule

Run every 1-5 minutes via your platform scheduler:
- call `POST /api/internal/jobs/drain`
- include `x-webcoinlabs-job-secret`

### 5.5 Configure Founder OS expansion schedules

Run every 3 minutes:
- call `POST /api/internal/jobs/openclaw-sync`
- include `x-webcoinlabs-job-secret`

Run every 1 minute:
- call `POST /api/internal/jobs/tokenomics-import`
- include `x-webcoinlabs-job-secret`

---

## 6) First 24 Hours Monitoring

Track:
- pitch analysis failures (`pitchdeck.*`)
- moderation failures (`uploadModeration.*`)
- reminder dispatch warnings (`events.*`, `notifications.eventReminder`)
- storage health anomalies
- auth/login spikes

If `OBSERVABILITY_SINK_URL` is configured, verify log ingestion volume and alerting.

---

## 7) Rollback Strategy

If critical regression is detected:

1. Roll app back to prior known-good deployment.
2. Keep DB schema as-is (no destructive down migration).
3. Apply forward corrective patch migration if needed.
4. Re-run smoke tests on rolled-back app.

Do **not** force destructive DB rollback on live user data.

---

## 8) Final Sign-Off Checklist

- [ ] Staging matrix complete
- [ ] Production migration complete
- [ ] Production storage health check passed
- [ ] Internal drain job scheduled
- [ ] Headers and RBAC validated in production
- [ ] Launch owner sign-off

