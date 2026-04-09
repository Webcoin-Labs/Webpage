# Webcoin Labs — Implementation status

Last updated: 2026-04-08  

This document summarizes **what is implemented**, **what is partially done or in migration**, and **what is still planned or incomplete**, based on `docs/*`, `prisma/schema.prisma`, and the App Router layout.

---

## Implemented (shipping in repo)

### Platform and runtime

| Area | Status | Notes |
|------|--------|--------|
| Next.js App Router (marketing + app) | Done | `app/(marketing)/*`, `app/app/*`, `app/api/*` |
| Supabase Auth + internal `User` mapping | Done | See `docs/auth-architecture.md`, `docs/architecture/request-flows.md` |
| Middleware for `/app/*` and admin namespace | Done | `docs/roles-and-permissions.md` |
| PostgreSQL + Prisma | Done | Migrations under `prisma/migrations/`, schema in `prisma/schema.prisma` |
| Environment validation | Done | `lib/env.ts` (build vs runtime behavior documented in `docs/release-checklist.md`) |
| Storage abstraction | Done | R2, Vercel Blob, local (`lib/storage/*`) |
| Audit logging for sensitive mutations | Done | `MutationAuditLog`, admin guarantees in docs |
| CI pipeline | Done | `.github/workflows/ci.yml` — lint, typecheck, build, test, e2e smoke, release-gate on `main` |
| Release / ops scripts | Done | `pnpm release:gate`, `scripts/*` (certify integrations, ops readiness, perf budget) |

### Role workspaces (authenticated app)

| Surface | Status | Notes |
|---------|--------|--------|
| Founder OS | Done | `app/app/founder-os/*`, ventures, investor applications, pitch/token flows |
| Builder OS | Done | `app/app/builder-os/*`, projects, builder program apply |
| Investor OS | Done | `app/app/investor-os/*`, venture review routes |
| Admin | Done | `app/app/admin/*` — events, moderation, uploads, rewards, partners, jobs, intros, leads, storage, advisors, pitch-decks, hiring-interests, notifications |
| Onboarding | Done | `app/app/onboarding/page.tsx` |
| Profile / settings / workspaces | Done | `app/app/profile`, `settings`, `workspaces` |
| In-app docs | Done | `app/app/docs/*` backed by `lib/docs.tsx` |
| Ecosystem feed | Done | `app/app/ecosystem-feed` |
| Jobs & applications | Done | `jobs`, `applications`, `apply/*`, hiring |
| Events | Done | Listing, detail, calendar, mine, RSVPs, admin event CRUD, iCal route |
| Messaging / notifications | Done | `messages`, `notifications` pages present |
| Rewards | Done | User + admin rewards |
| Intros | Done | `intros`, `intros/new`, admin intros |

### Public and discovery (marketing + SEO)

| Area | Status | Notes |
|------|--------|--------|
| Marketing pages | Done | Home, products, pricing, contact, insights, case studies, network, builders, startups, projects, services, etc. |
| Public founder / builder / investor profiles | Done | `app/founder/[username]`, `app/builder/[username]`, `app/investor/[[...segments]]` |
| Sitemap / robots | Done | `app/sitemap.ts`, `robots.txt` route |
| Visibility-aware public selectors | Done | `server/selectors/public-profile.selectors.ts`, `server/policies/visibility.ts` |

### Product features

| Feature | Status | Notes |
|---------|--------|--------|
| Pitch deck upload + AI analysis / workspace | Done | Actions in `app/actions/pitchdeck.ts`, UI in `components/pitchdeck/*`, feature helpers in `features/pitch-decks/*` |
| Tokenomics workspace + export APIs | Done | Components + `app/api/tokenomics/*` |
| Integrations (OAuth + native) | Done | GitHub, Google, Notion, Jira, Calendly; OpenClaw/Telegram; wallet — see `docs/operations/integrations-setup.md` |
| Integration sync jobs | Done | `app/api/internal/jobs/integration-sync`, OpenClaw sync, tokenomics import, drain |
| Connection requests + contact flows | Done | `ConnectionRequest`, profile contact APIs |
| Scoring engine (module) | Done | `features/scoring/engine.ts`, `server/services/scoring.service.ts`, `docs/scoring-system.md` |
| Startup hub / discovery adapters | Done | `lib/startup-hub.ts`, `server/services/discovery.service.ts` |
| Advisor flows | Done | `app/advisor/*`, admin advisors, project advisor invites |

### Testing

| Type | Status | Notes |
|------|--------|--------|
| Unit / integration (Vitest) | Done | `tests/*.test.ts` |
| E2E (Playwright) | Done | `tests/e2e/*.spec.ts`, smoke + role flows |

---

## Partially implemented or in active migration

These exist in code/schema but **docs explicitly describe phased compatibility** or **policy consolidation still in progress**:

| Topic | What exists | What is still open |
|-------|-------------|---------------------|
| Canonical graph vs legacy | `Venture`, `InvestorApplication`, `WalletConnection`, `IntegrationConnection`; bridges on `Startup` / `Project` / `Investor` | Full cutover from `Startup` / `Project` / legacy investor paths; run/verify `pnpm db:backfill:canonical` where needed (`docs/domain-model.md`) |
| Workspace-aware authorization | `UserWorkspace`, policies in `server/policies/authz.ts` | “Migration in progress” to workspace-aware checks everywhere; some routes still use legacy role checks (`docs/roles-and-permissions.md`) |
| Planned canonical extensions (tables) | `ScoreSnapshot`, `DiligenceMemo`, `AdminAssignment`, `VisibilityRule` in schema | **Planned completion** per domain doc: opportunity unification, diligence memo usage across flows, score snapshot persistence everywhere, admin routing UI/actions, visibility rules + internal notes end-to-end (`docs/domain-model.md`) |
| Read model consolidation | Services + selectors for many flows | Progressive move of page-level Prisma usage to selectors/services (`docs/architecture.md`) |
| Integrations | Many providers connected | Cal.com / Farcaster **manual**; GitHub OAuth + periodic sync provenance called out as future in `docs/integrations.md` |
| Legacy site | `_legacy/` assets | Old HTML/PHP/JS; not part of Next app — safe removal only after confirming no external links (`PROJECT_REPORT.md`) |

---

## Not implemented (or not product-complete) — from docs / gaps

| Item | Source | Meaning |
|------|--------|---------|
| “Complete” opportunity model (single unified model across builder/founder/investor) | `docs/domain-model.md` | Schema/features may exist in pieces; **unification** is listed as a remaining migration phase |
| Diligence memo as first-class flow everywhere | `docs/domain-model.md` | Model exists; **full product coverage** TBD |
| Admin routing assignment as full workflow | `docs/domain-model.md` | `AdminAssignment` exists; **consistent UI/actions** TBD |
| Visibility rules + internal notes as full feature | `docs/domain-model.md` | `VisibilityRule` exists; **full enforcement + UX** TBD |
| Removal of all legacy duplication | `docs/architecture.md` | Explicitly **after** parity + backfill |

**Note:** “Not implemented” here means **not finished as a unified, documented product phase** — not that there is zero code.

---

## How to re-verify quickly

- **Architecture intent:** `docs/README.md`, `docs/architecture/system-design.md`
- **Domain + migration:** `docs/domain-model.md`, `docs/architecture.md`
- **Roles:** `docs/roles-and-permissions.md`
- **Ship gate:** `docs/release-checklist.md`, `pnpm release:gate` (on `main` in CI)

---

## Suggested next documentation update

When a migration phase completes, update this file and `docs/domain-model.md` so “Planned canonical extensions” stays accurate.
