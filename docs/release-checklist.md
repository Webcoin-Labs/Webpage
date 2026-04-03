# Release Checklist (Mandatory)

This checklist is required before every production deploy.

## One-click gate

Run this from repo root:

```bash
pnpm release:gate
```

This command runs:
- Prisma client generation
- Prisma schema sync for test DB
- TypeScript typecheck
- Unit/integration tests
- Full E2E suite
- Ops readiness checks

## CI gate

On pushes to `main`, GitHub Actions runs `release-gate` in `.github/workflows/ci.yml`.

Treat deployment as blocked if `release-gate` is not green.

## Manual verification before deploy

1. Founder flow: create/maintain venture -> submit investor application.
2. Investor flow: review application -> update status.
3. Builder flow: apply to opportunity/job -> verify status path.
4. Admin flow: create assignment/routing -> verify audit log entries.
5. Public pages:
   - `/founder/[username]`
   - `/builder/[username]`
   - `/investor/[username]`
   - `/investor/[company]/[username]`
   - `/investor/[company]`
6. Visibility checks:
   - investor-only contact fields hidden for anonymous/public viewers
   - internal/admin data never exposed in public pages

## Required environment validation

Production environment must include:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `APP_ENCRYPTION_SECRET`
- `INTERNAL_JOBS_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Optional live integration certification:
- `CERT_GITHUB_TOKEN`
- `CERT_GOOGLE_ACCESS_TOKEN`

Run:

```bash
pnpm certify:integrations
pnpm check:ops-readiness
```

## Deploy decision

Deploy only when:
- `release-gate` is green
- CI checks are green
- manual verification passes
- no unresolved high-severity incidents or migration risks
