# Webcoin Labs

Webcoin Labs is a production-grade blockchain operating system with three role workspaces:

- Founder OS
- Builder OS
- Investor OS

This repository implements a multi-role, wallet-aware Next.js application with public profile routing, role-aware onboarding, investor application pipelines, premium quotas, and extension-ready integration architecture.

## Shared Graph Refactor Status

Webcoin Labs is currently running a phased-compat refactor:
- shared policy layer added (`server/policies/authz.ts`)
- typed service contracts added (`server/services/contracts.ts`)
- additive domain services introduced for identity, venture, discovery, applications, scoring, integrations, diligence, and admin routing
- public profile selector hardening added (`server/selectors/public-profile.selectors.ts`)
- transparent scoring engine added (`features/scoring/engine.ts` + `server/services/scoring.service.ts`)
- placeholder-only authenticated surfaces replaced with data-backed pages (`/app/events`, `/app/kreatorboard`)

## Architecture Docs

- `docs/architecture.md`
- `docs/domain-model.md`
- `docs/roles-and-permissions.md`
- `docs/scoring-system.md`
- `docs/integrations.md`
- `docs/admin-os.md`

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + Framer Motion
- Prisma + PostgreSQL
- NextAuth
- Server Actions for secure mutations

## Founder OS Expansion Hardening

- Detailed status, remaining work, manual ops, and timeline are tracked in:
  - `docs/founder-os-expansion-status.md`
- Forward-safe SQL migration for hardening changes:
  - `prisma/migrations/20260321133000_founder_os_expansion_hardening/migration.sql`
- One-command SQL apply helper:
  - `pnpm db:apply:founder-hardening`

## Canonical Graph Foundation Migration

New additive canonical models + bridges are available via:
- `prisma/migrations/20260323070000_add_canonical_graph_foundation/migration.sql`

Recommended rollout:
1. Apply migration on staging.
2. Run canonical backfill:
   - `pnpm db:backfill:canonical`
3. Validate Founder/Builder/Investor/Admin critical flows.
4. Apply to production during low-traffic window.

## Final Information Architecture

### Primary Product Surfaces

- Marketing/public site (`app/(marketing)/*`)
- Authenticated app shell (`app/app/*`)
- Public identities:
  - `/founder/[username]`
  - `/builder/[username]`
  - `/investor/[username]`
  - `/investor/[company-slug]/[username]`
  - `/investor/[company-slug]`

### Authenticated Workspace Surfaces

- `/app/workspaces`: workspace selector and role switching
- `/app/founder-os`: founder command center (existing + preserved)
- `/app/founder-os/investor-applications`: investor outreach pipeline with quota gating
- `/app/builder-os`: proof-of-work builder operating system
- `/app/investor-os`: investor deal-flow and application review inbox
- `/app/events`: future-ready placeholder (no fake data)

## Route Structure (Core)

### Existing Core App

- `/app`
- `/app/profile`
- `/app/settings`
- `/app/founder-os`
- `/app/builder-projects`
- `/app/events`
- `/app/admin/*`

### New Role/OS Routes

- `/app/workspaces`
- `/app/builder-os`
- `/app/investor-os`
- `/app/founder-os/investor-applications`

### New Public Routes

- `/founder/[username]`
- `/builder/[username]`
- `/investor/[[...segments]]`

`/investor/[[...segments]]` resolves these patterns:

- `/investor/[username]`
- `/investor/[company-slug]`
- `/investor/[company-slug]/[username]`

## Prisma Data Model (New + Preserved)

The schema preserves existing entities and adds production entities for Webcoin OS.

### New Enums

- `WorkspaceType`, `WorkspaceAccessStatus`
- `InvestorType`
- `SubscriptionTier`, `SubscriptionStatus`
- `WalletNetwork`, `WalletProvider`
- `IntegrationProvider`, `IntegrationStatus`
- `InvestorApplicationReviewStatus`
- `MiniAppPlatform`

### New Models

- `UserWorkspace`
- `WalletConnection`
- `IntegrationConnection`
- `InvestorCompany`
- `InvestorCompanyMember`
- `Venture`
- `VentureMember`
- `PitchDeckAssignment`
- `InvestorApplication`
- `FounderInvestorRequestQuota`
- `PremiumSubscription`
- `PublicProfileSettings`
- `MiniAppMetadata`
- `ResumeDocument`
- `CoverLetterDraft`
- `EmailThread`
- `EmailMessageMeta`
- `WorkspaceMeeting`
- `EventsModuleState`

### Existing Models Extended

- `User`: base bio/education/socials + workspace/premium/wallet/integration relations
- `BuilderProfile`: education, stack, chain expertise, availability, intent fields
- `FounderProfile`: founder description, education, intent, mini app links
- `InvestorProfile`: investor type, focus arrays, check size range, company relation, visibility
- `PitchDeck`: assignment relation support

## Server Action / Mutation Plan

Implemented in `app/actions/webcoin-os.ts`:

- `switchWorkspace`
- `saveProfileIdentity`
- `completeWorkspaceOnboarding`
- `saveOnboardingIntegrations`
- `saveWalletConnection`
- `saveMiniAppMetadata`
- `submitInvestorApplication`
- `updateInvestorApplicationStatus`
- `upsertResumeDocument`
- `createCoverLetterDraft`

Existing role/profile actions remain active and were not removed.

## Onboarding Flow (Multi-step)

`/app/onboarding` now runs a 5-step flow:

1. Workspace selection
2. Identity (name, username, bio, education, social links)
3. Role-specific setup (Founder/Builder/Investor)
4. Integrations + wallet linking (EVM/Solana)
5. Preview + publish

Behavior:

- Founder and Builder can be enabled on one account
- Investor workspace remains restricted unless investor profile exists

## Public Profile System

Implemented in `lib/public-profiles.ts` + public routes.

- Founder pages include founder identity, ventures, and wallet visibility
- Builder pages include stack, GitHub signal, projects, and wallet visibility
- Investor pages support both independent and firm-affiliated URL patterns
- Company pages list affiliated investor members

## Founder OS

Preserved existing founder command center and added a dedicated investor application module:

- Venture/deck/investor selection
- Founder note submission
- Quota enforcement with tier-aware limits
- Application status visibility

## Builder OS

New `/app/builder-os` includes:

- Quantified profile/proof indicators
- Portfolio and GitHub visibility
- Resume document management
- Cover letter draft management
- Mini app/web3 project metadata manager

## Investor OS

New `/app/investor-os` includes:

- Quantified pipeline summary
- Investor identity and company context
- Founder applications inbox with status transitions
- Meeting and venture discovery panels

## Premium Gating Logic

Implemented in `submitInvestorApplication` + quota resolver:

- Free founders: up to 3 applications per cycle
- Premium founders: up to 10 applications per cycle
- Cycle resets monthly
- Quota state stored in `FounderInvestorRequestQuota`
- Tier source: `PremiumSubscription`

## Web3-Native Architecture

- Wallet model supports EVM + Solana
- Onboarding supports wallet connection capture
- Public profile wallet display controlled by settings model
- Mini app metadata model supports Base/Farcaster/Other and manifest URLs

## Integrations Architecture

- Integration connections tracked by provider/status/scopes/token metadata
- Supported providers in schema/action layer:
  - Gmail
  - Google Calendar
  - Notion
  - GitHub
  - Jira
  - Calendly
  - Cal.com
  - Farcaster

## Empty / Loading / Error States

Implemented patterns:

- Empty states across new OS pages (projects, apps, meetings, integrations)
- Clear no-data messaging with next actions
- Server action failures return explicit user-safe messages
- Events surface explicitly avoids fake cards and states future expansion

## No Demo Data Policy

- `prisma/seed.ts` is now intentionally no-op
- No synthetic startup/investor/builder records are seeded
- Data is expected through real onboarding and workspace flows

## Setup

1. Install dependencies

```bash
pnpm install
```

2. Generate Prisma client

```bash
pnpm db:generate
```

3. Create and apply migration(s)

```bash
pnpm db:migrate
```

4. Run development server

```bash
pnpm dev
```

## Environment Variables

Use `.env.example` as baseline and ensure these are configured:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- OAuth keys as needed (`GOOGLE_*`, `GITHUB_*`)
- AI/storage variables depending on deployment mode

## Architecture Notes

- Existing production modules are preserved unless superseded by role-specific OS surfaces.
- New modules are additive and non-destructive.
- Investor/founder/builder systems now have dedicated route surfaces while retaining backward compatibility with existing pages.
