# Webcoin Labs Production Checklist

## 1. Required Environment Variables
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (required in production)
- `STORAGE_PROVIDER` (`r2` or `local`)
- R2 mode:
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT` or `R2_ACCOUNT_ID`
- Local mode:
- `LOCAL_STORAGE_ROOT`
- `PUBLIC_UPLOAD_ROOT`
- AI:
- `GEMINI_API_KEY` (required in production for pitch analysis)
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (required in production)
- `INTERNAL_JOBS_SECRET` (required in production)
- Founder OS expansion:
- `OPENCLAW_BASE_URL`
- `OPENCLAW_API_KEY`
- `APP_ENCRYPTION_SECRET`
- Optional OAuth pairs:
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET`

## 2. Pre-Deploy Validation
1. Run `npm ci`.
2. Run `npx prisma migrate deploy`.
3. Run `npx prisma generate`.
4. Run `npm run lint:ci`.
5. Run `npm run build`.
6. Verify no missing env errors from `lib/env.ts`.

## 3. Database Migration and Rollback
- Deploy migrations with `npx prisma migrate deploy`.
- Confirm new moderation tables exist:
- `UploadAsset`
- `UploadModerationLog`
- Rollback strategy:
- If migration introduces production issue, deploy prior application version first.
- Apply corrective forward migration instead of destructive rollback.
- Keep a pre-deploy DB snapshot/backup before applying migrations.

## 4. Storage Setup
- For R2:
- Confirm bucket exists and credentials have read/write/delete permissions.
- Validate endpoint resolves (`R2_ENDPOINT` or derived from `R2_ACCOUNT_ID`).
- For local:
- Ensure `LOCAL_STORAGE_ROOT` path exists and is writable.
- Ensure Next.js static serving exposes `PUBLIC_UPLOAD_ROOT`.
- Smoke test:
- Upload avatar
- Upload company logo
- Upload pitch deck
- Verify retrieval + moderation remove/restore behavior

## 5. Security Headers Summary
Configured in `next.config.mjs`:
- `Content-Security-Policy`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `X-Content-Type-Options`
- `X-DNS-Prefetch-Control`
- `X-Permitted-Cross-Domain-Policies`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy`
- `Strict-Transport-Security` (production only)

## 6. App Security and Access Checks
- Confirm admin-only actions:
- `/app/admin/uploads`
- upload moderation server actions
- Confirm profile/admin server actions validate session role and identifiers.
- Confirm delete requires explicit `REMOVE` token in moderation flow.
- Confirm app routes remain noindex:
- `robots.ts` disallows `/app` and `/api`
- app layout metadata sets noindex for dashboard routes

## 7. Rate Limit and Abuse Controls
- Verify rate limits for:
- profile upserts
- hiring-interest submissions
- pitch deck uploads/retries
- admin upload moderation actions
- For multi-instance production, replace in-memory limiter with Redis/Upstash.

## 8. Logging and Error Handling
- `lib/logger.ts` emits structured logs with sensitive field redaction.
- Confirm logging destination in host platform (Vercel logs, Datadog, etc.).
- Verify critical failure logs:
- upload processing
- moderation actions
- pitch analysis failures
- hiring/profile action failures

## 9. Post-Deploy Smoke Tests
1. Login with founder account.
2. Update founder profile and company logo.
3. Toggle hiring and submit builder interest.
4. Upload pitch deck and verify AI report generation.
5. Login as admin and moderate an upload:
- flag
- quarantine
- restore
- remove (with and without storage deletion)
- reprocess
6. Verify moderated assets fall back correctly across:
- profile headers
- cards
- dashboard identity blocks

## 10. Monitoring for First 48 Hours
- Error volume for `uploadModeration.*` and `pitchdeck.*` logs.
- Upload failure rates and status distribution (`FAILED`, `REPROCESSING`).
- DB growth on `UploadModerationLog`.
- Auth/sign-in error spikes.
- R2/local storage latency and failure rates.
