# Webcoin Labs - Project Status Report

Generated: 2026-04-08  
Repository: `E:\webcoinlabs`

This file is a handoff summary you can paste into ChatGPT for fast project context.

## 1) What this project is

Webcoin Labs is a role-based venture operating platform with:
- Founder workspace
- Builder workspace
- Investor workspace
- Admin workspace
- Public profile and discovery layer

Core stack:
- Next.js App Router (`next@15`)
- TypeScript
- Prisma + PostgreSQL
- Supabase Auth
- Playwright + Vitest tests
- Cloudflare R2 / local storage
- OAuth + native integration plugins

## 2) Current implementation status (what is done)

Based on repository docs and code organization, the following are implemented:

### Platform foundations
- Multi-surface routing for marketing and authenticated app (`webcoinlabs.com` + `app.webcoinlabs.com`)
- Supabase-based authentication with internal user mapping
- Role-aware route surfaces for Founder/Builder/Investor/Admin
- Server action + API route architecture with policy and selector layers

### Core product surfaces
- Founder OS pages and actions (venture profile, investor applications, pitch/token workflows)
- Builder OS pages and actions (profile, projects, opportunities/applications)
- Investor OS pages and actions (discovery and venture review surfaces)
- Admin OS tooling (moderation, rewards, partners, events, routing, uploads)
- Public profile routes for founder, builder, investor with visibility controls

### Data and backend
- Prisma schema and migration history in place (18 tracked prisma files including migrations/schema/seed)
- Canonical graph foundation introduced (`Venture`, `InvestorApplication`, canonical bridge fields)
- Service layer present in `server/services/*` for discovery, diligence, scoring, identity, applications, routing
- Authorization and visibility policy modules present in `server/policies/*`

### Integrations and automation
- OAuth plugin flows implemented for GitHub, Google (Gmail/Calendar), Notion, Jira, Calendly
- Native integrations implemented for OpenClaw, Telegram (via OpenClaw), Wallet identity connection
- Integration sync endpoints and ops scripts implemented
- Ops readiness and integration certification scripts present

### Quality and release gates
- Unit/integration tests + e2e tests configured
- Release gate script configured (`pnpm release:gate`) for typecheck + test + e2e + perf + ops checks
- Release checklist documented in `docs/release-checklist.md`

## 3) What still needs to be done (inferred from docs/code)

These are explicit or strongly implied pending items:

### Canonical model migration (in progress)
From `docs/domain-model.md` and `docs/roles-and-permissions.md`:
- Complete opportunity model unification
- Add/finish diligence memo first-class usage across all flows
- Persist score snapshots consistently across scoring surfaces
- Finalize admin routing assignment model usage across UI/actions
- Finalize visibility rule + internal note model coverage
- Remove remaining legacy route/model dependencies after staged migration

### Role/workspace policy consolidation
- Continue migration from mixed legacy route role checks to fully workspace-aware policy checks
- Ensure all server mutations consistently use central policy helpers

### Legacy cleanup
- `_legacy/` still exists and contains old assets/PHP/server files
- A known TODO/FIXME marker exists in `_legacy/assets/php/mail.php` (`FIXME: Update email address`)
- Confirm whether legacy code is still required; archive or remove safely if obsolete

### Operational completion
- Validate production env values and callback URLs in all providers
- Run and keep green: `pnpm release:gate`
- Keep integration sync job schedule active and monitored

## 4) Project structure (current)

## Repository-level map

```text
E:\webcoinlabs
|- app/                  (175 files) Next.js routes, API handlers, server actions
|- components/           (97 files) Reusable and feature UI components
|- lib/                  (55 files) Auth, integrations, storage, AI, utilities
|- server/               (15 files) Policies, selectors, domain services
|- prisma/               (18 files) Schema, migrations, seed
|- tests/                (16 files) Vitest + Playwright tests
|- scripts/              (7 files) Ops/readiness/certification/backfill scripts
|- docs/                 (18 matched docs-related paths) Architecture + operations docs
|- features/             (1 file) Feature module(s), currently scoring engine
|- public/               (12 files) Static assets
|- _legacy/              Legacy code/assets kept for compatibility
|- package.json
|- pnpm-lock.yaml
|- readme.md
```

## Important route areas

```text
app/
|- (marketing)/          Public pages
|- app/                  Authenticated shell
|  |- founder-os/
|  |- builder-os/
|  |- investor-os/
|  |- admin/
|  |- onboarding/
|  |- settings/
|  |- docs/
|- api/                  Integrations, exports, internal jobs, admin routes
|- auth/                 Auth callback routes
|- login/                Auth entry pages
|- founder/              Public founder pages
|- builder/              Public builder pages
|- investor/             Public investor pages
```

## Important backend ownership

```text
server/
|- policies/
|  |- authz.ts
|  |- visibility.ts
|- selectors/
|  |- public-profile.selectors.ts
|- services/
|  |- application.service.ts
|  |- canonical-graph.service.ts
|  |- diligence.service.ts
|  |- discovery.service.ts
|  |- scoring.service.ts
|  |- admin-routing.service.ts
|  |- ...others
```

## Important shared runtime modules

```text
lib/
|- auth.ts, auth-config.ts, auth-client.tsx
|- env.ts
|- prisma.ts
|- integrations/ (oauth, plugins, sync)
|- ai/ (providers, pitch analysis/rewrite, founder OS helpers)
|- storage/ (r2, local, vercel blob adapters)
|- notifications/
|- tokenomics/
|- security/
```

## 5) Key docs to read first

- `readme.md`
- `docs/README.md`
- `docs/architecture/system-design.md`
- `docs/architecture/folder-structure.md`
- `docs/architecture/request-flows.md`
- `docs/architecture/deployment-architecture.md`
- `docs/domain-model.md`
- `docs/roles-and-permissions.md`
- `docs/release-checklist.md`
- `docs/operations/integrations-setup.md`

## 6) Suggested prompt to ChatGPT (copy/paste)

```md
I’m sharing a Webcoin Labs project report. Please do the following:
1) Create a prioritized execution roadmap for the remaining migration and hardening work.
2) Split tasks into: immediate (this week), short-term (2-4 weeks), and mid-term (1-2 months).
3) For each task, include: objective, impacted files/folders, acceptance criteria, and risks.
4) Focus on canonical model completion, policy consolidation, legacy cleanup, and release reliability.
5) Assume stack: Next.js 15, TypeScript, Prisma/Postgres, Supabase Auth, Playwright/Vitest.
```

