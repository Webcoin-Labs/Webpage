# Webcoin Labs — Phase 1 Architecture Audit
> Generated: 2026-04-08 | Pre-refactor safety baseline

---

## 1. Audit Summary

The codebase is in **better shape than the brief implied**. The core service, policy, and selector layers are coherent and should be treated as the stable backbone. The main structural risks are:

- **Route-local business logic** — most product logic still lives inside `app/actions/*.ts` (30 files, some >48KB), bypassing `features/`
- **`features/` is almost empty** — only `features/scoring/` exists; all domain logic is in actions or services
- **OS dashboards are healthy but overloaded** — each OS page does too much in one RSC with too many metric cards
- **Module registry drives navigation** — `lib/os/modules.ts` is the single source of truth for sidebar nav; it must not be broken
- **Feed is already action-driven** — `lib/ecosystem-feed.ts` generates items from real entities, NOT social posts. No fake engagement. This is already correct architecture.
- **`_legacy/` contains old HTML, assets, server, vcs code** — not imported by the active app
- **Public profiles are solid** — `/founder/[username]`, `/builder/[username]`, `/investor/[[...segments]]` use selectors + policies correctly
- **Pitch deck and tokenomics** — live at `app/api/pitchdeck/` and `app/api/tokenomics/`, protected by middleware and action-level authz

---

## 2. Route Structure Audit

### 2a. Public Routes (no auth required)

| Route | Status | Classification |
|-------|--------|----------------|
| `/` | Marketing homepage | **Keep** |
| `/founder/[username]` | Public founder profile | **Keep** |
| `/builder/[username]` | Public builder profile | **Keep** |
| `/investor/[[...segments]]` | Public investor profile (catch-all) | **Keep** |
| `/login` | Auth entry | **Keep** |
| `/auth/callback` | Supabase OAuth callback | **Keep** |
| `/(marketing)/pricing` | Pricing page | **Keep** |
| `/(marketing)/build` | Builder landing | **Keep** |
| `/(marketing)/builders` | Builder index | **Keep** |
| `/(marketing)/startups` | Startup index | **Keep** |
| `/(marketing)/ecosystems` | Ecosystem page | **Keep** |
| `/(marketing)/network` | Network page | **Keep** |
| `/(marketing)/webcoin-labs-2-0` | Legacy marketing page | **Hide** |
| `/(marketing)/case-studies` | Case studies | **Keep** |
| `/(marketing)/insights` | Insights/blog | **Keep** |
| `/(marketing)/contact` | Contact | **Keep** |
| `/(marketing)/products` | Products | **Simplify** |
| `/(marketing)/services` | Services | **Simplify** |
| `/(marketing)/projects` | Public projects | **Simplify** |
| `/pitchdeck` | Public pitch deck view | **Keep** |

### 2b. Authenticated Routes (`/app/*`)

| Route | Classification |
|-------|----------------|
| `/app` | **Keep** (redirect to role surface) |
| `/app/founder-os` | **Simplify surface, keep route** |
| `/app/founder-os/[app]` | **Keep routes, simplify internals** |
| `/app/founder-os/ventures` | **Keep** |
| `/app/founder-os/investor-applications` | **Keep** |
| `/app/founder-os/join` | **Keep** |
| `/app/builder-os` | **Simplify surface, keep route** |
| `/app/builder-os/[app]` | **Keep routes, simplify internals** |
| `/app/builder-os/projects` | **Keep** |
| `/app/investor-os` | **Simplify surface, keep route** |
| `/app/investor-os/[app]` | **Keep routes, simplify internals** |
| `/app/investor-os/ventures` | **Keep** |
| `/app/admin` | **Keep** |
| `/app/admin/*` | **Keep** |
| `/app/onboarding` | **Refactor** — 84KB single page, split into steps |
| `/app/profile` | **Refactor** — 37KB, extract components |
| `/app/settings` | **Refactor** — 29KB, extract integration cards |
| `/app/ecosystem-feed` | **Simplify** (remove social UI, keep action cards) |
| `/app/projects` | **Keep** |
| `/app/builder-projects` | **Keep** |
| `/app/matches` | **Keep** |
| `/app/messages` | **Defer** |
| `/app/notifications` | **Keep** |
| `/app/events` | **Simplify** |
| `/app/founders` | **Keep** |
| `/app/intros` | **Keep** |
| `/app/applications` | **Keep** |
| `/app/workspaces` | **Keep** |
| `/app/jobs` | **Keep** |
| `/app/hiring` | **Keep** |
| `/app/rewards` | **Defer** |
| `/app/kols-premium` | **Defer/Hide** |
| `/app/kreatorboard` | **Evaluate** |
| `/app/invite-community` | **Keep** |
| `/app/docs` | **Keep** |

### 2c. API Routes

| Route | Classification |
|-------|----------------|
| `/api/auth/*` | **Keep — do not touch** |
| `/api/pitchdeck/[pitchDeckId]` | **Keep** |
| `/api/tokenomics/[scenarioId]` | **Keep** |
| `/api/integrations/connect` | **Keep** |
| `/api/integrations/callback` | **Keep** |
| `/api/profiles/*` | **Keep** |
| `/api/admin/*` | **Keep** |
| `/api/uploads/*` | **Keep** |
| `/api/internal/*` | **Keep** |

---

## 3. Service Layer Audit (`server/services/`)

**Status: ✅ Stable backbone — do not rewrite**

| File | Purpose | Classification |
|------|---------|----------------|
| `canonical-graph.service.ts` | DiligenceMemo, ScoreSnapshot, AdminAssignment | **Keep** |
| `discovery.service.ts` | Builder matching, Venture matching | **Keep** |
| `identity.service.ts` | User identity | **Keep** |
| `scoring.service.ts` | Builder proof, Founder readiness, Investor fit | **Keep** |
| `application.service.ts` | Application handling | **Keep** |
| `diligence.service.ts` | Diligence memos | **Keep** |
| `venture.service.ts` | Venture operations | **Keep** |
| `integration.service.ts` | Integration connections | **Keep** |
| `admin-routing.service.ts` | Admin routing | **Keep** |
| `contracts.ts` | Service interfaces | **Keep** |

---

## 4. Policy Layer Audit (`server/policies/`)

**Status: ✅ Correct pattern — security boundary**

| File | Purpose | Classification |
|------|---------|----------------|
| `authz.ts` | `requireSessionUser()`, `assertAnyRole()`, `assertWorkspaceEnabled()` | **Keep** |
| `visibility.ts` | `canViewerAccessEntity()` — PUBLIC/SHARED/INTERNAL/PRIVATE rules | **Keep** |

---

## 5. Selector Layer Audit (`server/selectors/`)

| File | Purpose | Classification |
|------|---------|----------------|
| `public-profile.selectors.ts` | `selectFounderPublicProfile`, `selectBuilderPublicProfile` | **Keep** |

> **Gap:** No `selectInvestorPublicProfile`. Investor public profile logic is inline in `app/investor/[[...segments]]/page.tsx`. Extract to selector in Phase 6.

---

## 6. Canonical Entity Map

All entities already present in Prisma schema:

| Canonical Entity | Prisma Model | Status |
|-----------------|-------------|--------|
| User | `User` | ✅ |
| PublicProfile | `PublicProfileSettings` | ✅ |
| Startup | `Startup` | ✅ |
| Venture | `Venture` | ✅ (coexists with Startup) |
| BuilderProject | `BuilderProject` | ✅ |
| PitchDeck | `PitchDeck` | ✅ |
| TokenomicsModel | `TokenomicsScenario` | ✅ |
| FeedPost | `FeedPost` | ✅ |
| ConnectionRequest | `ConnectionRequest` | ✅ |
| IntegrationConnection | `IntegrationConnection` | ✅ |
| InvestorApplication | `InvestorApplication` | ✅ |
| DiligenceMemo | `DiligenceMemo` | ✅ |
| ProfileView | `ProfileView` | ✅ |
| ScoreSnapshot | `ScoreSnapshot` | ✅ |

> Startup + Venture **consolidation is deferred**. `canonicalVentureId` FK on `Startup` shows it is planned. Use adapter layer in Phase 2.

---

## 7. Feature Domain Gap Analysis

### `features/` is almost empty — only `features/scoring/` exists

All domain logic lives in `app/actions/*.ts` (30 files):

| Feature Domain | Current Location | Size | Target |
|---------------|-----------------|------|--------|
| pitch-decks | `app/actions/pitchdeck.ts` | 31KB | `features/pitch-decks/` |
| tokenomics | `app/actions/webcoin-os.ts` | 48KB | `features/tokenomics/` |
| onboarding | `app/app/onboarding/page.tsx` | 84KB | `features/onboarding/` |
| profiles | `app/actions/profile.ts` | 30KB | `features/profiles/` |
| startups | `app/actions/founder-os.ts` | 32KB | `features/startups/` |
| ventures | `app/actions/founder-os-expansion.ts` | 50KB | `features/ventures/` |
| builder-projects | `app/actions/builder-projects.ts` | 7.7KB | `features/builder-projects/` |
| feed | `lib/ecosystem-feed.ts` | 18KB | `features/feed/` |
| discovery | `server/services/discovery.service.ts` | 3KB | `features/discovery/` (wrap) |
| connections | `app/actions/connections.ts` | 6.2KB | `features/connections/` |
| integrations | `app/actions/settings.ts` | 2.8KB | `features/integrations/` |
| scoring | `features/scoring/` | - | ✅ Already done |

---

## 8. Component Audit

### `components/app/`

| Component | Size | Classification |
|-----------|------|----------------|
| `AppSidebar.tsx` | 21KB | **Refactor** — extract OS module sections |
| `AppTopNavUserMenu.tsx` | 3.8KB | **Keep** |
| `BuilderProfileForm.tsx` | 16KB | **Keep** |
| `BuilderProjectManager.tsx` | 16KB | **Keep** |
| `FounderProfileForm.tsx` | 27KB | **Refactor** — split sections |
| `InvestorProfileForm.tsx` | 10KB | **Keep** |
| `SettingsForm.tsx` | 5.3KB | **Keep** |
| `OnboardingGuard.tsx` | 0.7KB | **Keep** |
| `WalletConnectionCard.tsx` | 7.4KB | **Keep** |
| `AdminUploadModerationTable.tsx` | 14KB | **Keep** |
| `NewIntroRequestForm.tsx` | 8KB | **Keep** |

### `components/os/`

| Component | Classification |
|-----------|----------------|
| `OsWorkspaceShell.tsx` | **Keep** |
| `WorkspaceWidgets.tsx` | **Keep** |
| `FounderOsLauncherGrid.tsx` | **Keep** |
| `BuilderOsLauncherGrid.tsx` | **Keep** |
| `FounderOsModuleTabs.tsx` | **Simplify** |
| `FounderOsAccessWarning.tsx` | **Keep** |
| `SmartSuggestionsPanel.tsx` | **Refactor** — wire to real data |
| `OsLoading.tsx` | **Keep** |

### `components/public-profile/` — ✅ Already clean

All 9 components: **Keep + Polish in Phase 6**

---

## 9. Feed Audit

### `lib/ecosystem-feed.ts` — ✅ Already correct architecture

The feed is **NOT social**. It generates items from real entities:

| Source | Type | Auto-generated |
|--------|------|---------------|
| `FeedPost` | Explicit authored post | No |
| `Startup` | Startup launch card | Yes |
| `RaiseRound` | Fundraising update | Yes |
| `FounderProfile` (isHiring) | Hiring signal | Yes |
| `BuilderProject` | Shipped project | Yes |
| `BuilderProfile` (openToWork) | Available builder | Yes |
| `InvestorProfile` | Thesis/open call | Yes |

**Role-aware scoping already works** via `FeedScope` = GLOBAL / FOUNDER / BUILDER / INVESTOR.

**What to change in feed UI only:**
- Remove: like/comment/share social controls (if present in frontend)
- Remove: empty placeholder panels
- Add: action chips — `Open Profile`, `View Startup`, `Connect`, `Request Intro`
- Add: source badge on feed items

---

## 10. Integration Audit

| Integration | Status |
|-------------|--------|
| GitHub OAuth | ✅ Working |
| Google OAuth | ✅ Working |
| Notion | ✅ Working |
| Jira | ✅ Working |
| Calendly | ✅ Working (`MeetingLink` model) |

**Problem:** Integration UX is scattered across settings page (raw forms), and OS sub-pages.

**Target:** Single `IntegrationStatusCard` component in `features/integrations/components/` with:
```tsx
type Props = {
  slug: string;
  name: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'error';
  lastSynced?: Date | null;
  connectHref: string;
  manageHref?: string;
};
```

---

## 11. Sidebar / Module Registry Audit

`lib/os/modules.ts` is the **single source of truth** for:
- Founder OS modules
- Builder OS modules
- Investor OS modules
- Sidebar navigation

`AppSidebar.tsx` consumes `founderModules`, `builderModules`, `investorModules` from this registry.

**Do not rename slugs.** They drive route paths like `/app/founder-os/${module.slug}`.

**Sidebar issues to fix:**
- Two "Settings" nav items both pointing to `/app/settings` (one labelled "Integrations", one "Settings")
- `⌘K` command palette button is dead UI (no handler)
- Search input in top nav is dead UI (no handler)
- "Sync Active" indicator is static (not wired to integration status)

---

## 12. Onboarding Audit

`app/app/onboarding/page.tsx` = **84KB single file** — highest internal complexity.

**Current protection:** `OnboardingGuard` + `forceOnboarding` in `app/app/layout.tsx` is correctly implemented.

**Refactor target (Phase 3):**
```
features/onboarding/
  steps/
    RoleSelectionStep.tsx
    ProfileCompletionStep.tsx
    IntegrationConnectStep.tsx (optional)
    WorkspaceSelectionStep.tsx
  OnboardingWizard.tsx
  useOnboardingState.ts
```

---

## 13. _legacy/ Status

Contents: `html/`, `assets/`, `images/`, `server/`, `vcs/`, `launchpad/`, `logo-designs/`

**Zero active imports found.** Safe to ignore. Do NOT delete in this phase.

---

## 14. Middleware & Auth Safety

`middleware.ts` protects `/app/*` and `/api/profiles/contact/*` using:
1. Supabase session (primary path)
2. NextAuth JWT (fallback)

**Do not modify middleware in any phase.**

---

## 15. What to Remove / Hide

| Target | Action | Phase |
|--------|--------|-------|
| `/(marketing)/webcoin-labs-2-0` | Hide (add `redirect` or `notFound()`) | Phase 8 |
| Social like/comment/share UI in feed | Remove from frontend only | Phase 5 |
| Dead placeholder panels in OS dashboards | Remove | Phase 4 |
| `app/app/kols-premium` | Defer/hide | Phase 4 |
| `app/app/rewards` | Defer | Phase 4 |
| Raw integration forms on primary pages | Remove, replace with IntegrationStatusCard | Phase 7 |
| `SmartSuggestionsPanel` static data | Refactor to real data or remove | Phase 4 |
| Dead `⌘K` button in top nav | Connect or remove | Phase 4 |
| Dead search input in top nav | Connect or remove | Phase 4 |
| "Sync Active" static indicator | Wire to real integration status | Phase 7 |

---

## 16. Phased Implementation Plan

### Phase 1 — Safety Baseline ✅ COMPLETE
Audit done. No code changes.

### Phase 2 — Canonical Adapters

Add adapter read-model for Startup + Venture coexistence:

```
features/startups/adapters/startup-venture.adapter.ts
features/startups/adapters/types.ts  (CanonicalStartup)
features/discovery/adapters/discovery.adapter.ts
```

No schema changes. No Prisma migrations.

### Phase 3 — Feature Domain Extraction

Priority:
1. `features/pitch-decks/` — extract from `app/actions/pitchdeck.ts`
2. `features/tokenomics/` — extract from `app/actions/webcoin-os.ts`
3. `features/onboarding/` — decompose 84KB page
4. `features/builder-projects/` — extract from actions
5. `features/profiles/` — extract from actions
6. `features/feed/` — move `lib/ecosystem-feed.ts`
7. `features/connections/`
8. `features/integrations/`

### Phase 4 — Surface Simplification

- Trim OS dashboard metric card overload
- Simplify sidebar
  - Fix duplicate Settings/Integrations links
  - Add notification badge
- Remove dead UI (⌘K, search, sync indicator)
- Hide kols-premium, rewards

### Phase 5 — Feed Refactor

- Remove social buttons from feed cards (frontend only)
- Add `FeedActionChip` component
- Add source badge
- Add role filter tabs

### Phase 6 — Public Profile Polish

- Extract `selectInvestorPublicProfile` to selectors
- Add banner with fallback gradient to `PublicProfileHero`
- Strengthen contact section
- Investor public profile polish

### Phase 7 — Integration UX Unification

- Build `IntegrationStatusCard` in `features/integrations/`
- Replace raw forms on core pages with this component
- Wire "Sync Active" to real integration status

### Phase 8 — Cleanup

- Remove `webcoin-labs-2-0` page
- Remove confirmed dead placeholder UI
- Archive _legacy in git history

---

## 17. What Is Preserved (no changes in Phase 1–2)

- All current route paths — no redirects added
- `middleware.ts` — unchanged
- `server/services/*` — unchanged
- `server/policies/*` — unchanged
- `server/selectors/*` — unchanged
- `lib/ecosystem-feed.ts` — unchanged
- `lib/os/modules.ts` — unchanged (module slugs = route segments)
- `app/api/pitchdeck/*` — unchanged
- `app/api/tokenomics/*` — unchanged
- `app/api/integrations/*` — unchanged
- `prisma/schema.prisma` — no changes
- `_legacy/` — untouched

---

## 18. What Remains Deferred

| Item | Reason |
|------|--------|
| Startup + Venture schema consolidation | Too risky; deferred past Phase 4 |
| Heavy messaging expansion | Out of scope |
| KOL / Rewards / Kreatorboard product decisions | Needs separate product review |
| Full onboarding redesign | Phase 3 |
| GitHub contribution graph on builder profile | Phase 6 nice-to-have |
| Command palette (`⌘K`) | Phase 4 |
| Push notifications | Deferred |

---

## 19. Regression Test Checklist

Run before any Phase 2+ changes:

```
Auth:
  [ ] Email OTP login (Supabase)
  [ ] GitHub OAuth login
  [ ] Middleware blocks /app/* for unauthenticated users
  [ ] Internal user sync (Supabase → Prisma user record)

Ownership / Authz:
  [ ] FOUNDER role → can access /app/founder-os
  [ ] BUILDER role → redirected away from /app/founder-os
  [ ] Pitch deck ownership check in API
  [ ] Tokenomics ownership check in API

Product Flows:
  [ ] Builder GitHub connect + repo import + project save
  [ ] Founder startup page create + edit + visibility toggle
  [ ] Pitch deck upload → analyze → section review → export
  [ ] Tokenomics generate → edit allocations → save → export
  [ ] Feed publishes post → appears role-filtered in /app/ecosystem-feed
  [ ] /founder/[username] renders for public profile
  [ ] /builder/[username] renders for public profile
  [ ] /investor/[...segments] renders for public profile
  [ ] All /app/* role surfaces resolve without 500

Onboarding:
  [ ] Incomplete user (no name/username) → forceOnboarding = true → OnboardingGuard shown
  [ ] Completed user → no onboarding redirect
  [ ] Reload does not reset role or workspace choice
```

Run: `pnpm typecheck && pnpm test`
