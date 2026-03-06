# Webcoin Labs 2.0 — Full Audit Report

**Audit type:** Security + Feature Completeness + Data Extraction  
**Date:** 2026  
**Scope:** `/app`, `/components`, `/lib`, `/prisma`, `/public`, middleware, API routes, server actions.

---

## A) REQUIREMENTS CHECKLIST (VERIFIED FROM CODE)

### A1) Marketing Website Pages — **PASS** (minor gaps)

| Requirement | Status | Evidence |
|-------------|--------|----------|
| `/` homepage | ✅ | `app/(marketing)/page.tsx` |
| Hero (Explore Platform, Book a Demo, View Pitch Deck) | ✅ | `components/hero/HeroSection.tsx` lines 46–65 |
| Trusted network logos strip | ✅ | `PartnerMarquee` in page.tsx, `components/partners/PartnerMarquee.tsx` |
| Industry Problems section | ✅ | `ProblemsSection` in page.tsx |
| Solution section | ✅ | `SolutionsSection` in page.tsx |
| Stats | ✅ | In Hero via `StatsCounter` (500K+ Community, etc.) |
| Three Pillars (Identity / Discovery / Access) | ✅ | `pillars` array + section in page.tsx |
| Products section + "See all our products" | ✅ | `ProductsSection`, link to `/products` |
| Services section + "See our services" | ✅ | `ServicesSection`, link to `/services` |
| Partner slider (infinite, watermarked) | ✅ | `PartnerMarquee` with watermark SVG, CSS marquee |
| Legacy credibility (2021–2023) | ✅ | Section "Webcoin Labs Legacy" in page.tsx |
| Insights | ✅ | Section + link to `/insights` |
| CTA (drive to /app) | ✅ | `HomepageCTA` — Book a Demo, Apply, Partner With Us |
| Floating help chat widget | ✅ | `ChatSupportWidget` in `(marketing)/layout.tsx` |
| `/products` | ✅ | `app/(marketing)/products/page.tsx` |
| `/services` | ✅ | `app/(marketing)/services/page.tsx` |
| `/network` (filter, current/legacy) | ✅ | `app/(marketing)/network/page.tsx`, `NetworkTabs` |
| `/builders` directory | ✅ | `app/(marketing)/builders/page.tsx` |
| `/builders/[handleOrId]` profile | ✅ | `app/(marketing)/builders/[handleOrId]/page.tsx` |
| `/projects` directory | ✅ | `app/(marketing)/projects/page.tsx` |
| `/projects/[slugOrId]` page | ✅ | `app/(marketing)/projects/[slugOrId]/page.tsx` |
| `/pitchdeck` (Deck 1 + Deck 2 coming soon) | ✅ | `app/(marketing)/pitchdeck/page.tsx` — Services PDF + Notify form |
| `/insights` | ✅ | `app/(marketing)/insights/page.tsx` |
| `/insights/[slug]` | ❌ | **Missing** — Only `insights/page.tsx` exists; links to `/insights/why-base` etc. will 404 |

**Homepage section order (actual):** Hero → Trusted network → Problems → Solutions → Three pillars → Products → Services → Industry focus → Partner network (Explore ecosystem) → Legacy credibility → How platform works → Insights → CTA. (Matches spec; "Stats" are inside Hero.)

---

### A2) Partner Assets + Folder Rules — **PARTIAL**

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Legacy assets in `_legacy/vcs`, `_legacy/launchpad`, etc. | ⚠️ | Repo has `_legacy/` but structure differs: `_legacy/html`, `_legacy/assets`, `_legacy/server` — no `_legacy/vcs`, `_legacy/launchpad`, `_legacy/logo-designs`, `_legacy/images` as specified |
| Public assets in `/public/network/current/`, `/public/network/legacy/` | ✅ | `public/network/current/` (animoca-brands.svg, base.svg, polygon.svg), `public/network/legacy/.gitkeep`; seed references paths like `/network/current/vc/`, `/network/legacy/` |
| Partner categories (VC, Launchpads, CEX, Portfolio, Guild, Media) | ✅ | `prisma/schema.prisma` `PartnerCategory` enum |
| Homepage featured slider + watermarked + infinite marquee | ✅ | `PartnerMarquee` with watermark, `partner-marquee-track` in globals.css |

**Missing:** Exact `_legacy` folder layout per spec (vcs, launchpad, logo-designs, images). If assets were moved or seed uses different paths, confirm logo files exist under `public/network/` for seeded `logoPath` values.

---

### A3) Platform Dashboard (`/app`) — **PASS**

| Requirement | Status | Evidence |
|-------------|--------|----------|
| `/app` authenticated portal | ✅ | `app/app/layout.tsx` — `getServerSession`, redirect if !session |
| Role selection / onboarding | ✅ | `app/app/onboarding/page.tsx` — Builder / Founder / Investor; `completeOnboarding` in `app/actions/onboarding.ts` |
| Builder profiles | ✅ | `app/app/profile/page.tsx`, `upsertBuilderProfile` |
| Founder profiles | ✅ | Same profile page, `upsertFounderProfile` |
| Project pages | ✅ | `app/app/projects/page.tsx`, `app/app/projects/new/page.tsx` |
| Applications (programs/founder support) | ✅ | `app/app/apply/page.tsx`, `app/app/applications/page.tsx`, `submitApplication` |
| Intro requests (VC/KOL) | ✅ | `app/app/intros/page.tsx`, `app/app/intros/new/page.tsx`, `app/actions/intro.ts` |
| `/app/admin` | ✅ | `app/app/admin/page.tsx` |
| Admin: review applications | ✅ | `app/app/admin/page.tsx` (AdminApplicationsTable), `updateApplicationStatus` |
| Admin: manage partners | ✅ | `app/app/admin/partners/page.tsx`, `createOrUpdatePartner` |
| Admin: manage intros | ✅ | `app/app/admin/intros/page.tsx`, `updateIntroRequestStatus` |
| Admin: moderate profiles | ✅ | `app/app/admin/moderation/page.tsx`, `setBuilderVisibility`, `setProjectVisibility`, etc. |
| Admin: rewards/claims | ✅ | `app/app/admin/rewards/page.tsx`, `app/actions/rewards.ts` |

---

### A4) Events System — **PASS**

| Requirement | Status | Evidence |
|-------------|--------|----------|
| `/app/events` | ✅ | `app/app/events/page.tsx` |
| `/app/events/[id]` | ✅ | `app/app/events/[id]/page.tsx` |
| `/app/events/calendar` | ✅ | `app/app/events/calendar/page.tsx` |
| `/app/events/mine` | ✅ | `app/app/events/mine/page.tsx` |
| `/app/admin/events` CRUD | ✅ | `app/app/admin/events/page.tsx`, `app/app/admin/events/new/page.tsx`, `app/app/admin/events/[id]/page.tsx` |
| Event, EventRsvp, EventReminder models | ✅ | `prisma/schema.prisma` |
| RSVP flow, published/unpublished, featured, visibility | ✅ | `app/actions/events.ts`, event detail page |
| iCal download | ✅ | `app/app/events/[id]/ical/route.ts`, `lib/ical.ts` |
| Recording / notes fields | ✅ | `Event.recordingUrl`, `Event.notesUrl` in schema and UI |

---

### A5) Calendly Integration — **PASS**

| Requirement | Status | Evidence |
|-------------|--------|----------|
| "Book a Demo" opens Calendly | ✅ | `useCalendly()` from `CalendlyProvider`, `CalendlyModal`; hero + CTA + navbar/footer |
| "Request Office Hours" uses Calendly | ✅ | Events hub links to `https://calendly.com/webcoinlabs/demo` (same as Book a Demo) |

---

## B) DATABASE + DATA MODEL AUDIT (PRISMA)

**Schema file:** `prisma/schema.prisma`

### Tables present

- **Account** — NextAuth (userId, provider, etc.)
- **Session** — NextAuth
- **User** — id, name, email, role, onboardingComplete, etc.
- **VerificationToken**
- **BuilderProfile** — userId (unique), handle (unique), skills[], interests[], etc.
- **FounderProfile** — userId (unique), companyName, etc.
- **Project** — ownerUserId, slug (unique), stage, etc.
- **Application** — userId, type, answers (Json), status, **eventId** (optional, FK to Event)
- **IntroRequest** — founderId, type (KOL/VC), requestPayload (Json), status
- **Partner** — slug (unique), category, status, featured, logoPath, etc.
- **Lead** — name, email, message, source
- **Reward** — userId (optional), label, amountText, status
- **Event** — slug (unique), type, track, format, visibility, startAt, endAt, meetingUrl, isPublished, isFeatured, recordingUrl, notesUrl, etc.
- **EventRsvp** — eventId, userId, status, checkedInAt; **@@unique([eventId, userId])**
- **EventReminder** — eventId, userId, remindAt, sentAt; **@@unique([eventId, userId])**

### Enums

- Role, ProjectStage, ApplicationType, ApplicationStatus, PartnerCategory, PartnerStatus, IntroType, RewardStatus  
- EventType, EventTrack, EventFormat, MeetingProvider, EventVisibility, RsvpStatus  

### Relations

- User → BuilderProfile, FounderProfile, Project, Application, IntroRequest, Reward, EventRsvp, EventReminder (all correct).
- Application → Event (eventId optional).
- Event → EventRsvp, EventReminder, Application[].
- EventRsvp/EventReminder → Event, User.
- Cascade: Account/Session/BuilderProfile/FounderProfile/Project/Application/IntroRequest/EventRsvp/EventReminder on User delete; EventRsvp/EventReminder on Event delete. Application.eventId SetNull on Event delete.

### Gaps

- **Soft delete:** Not implemented; all deletes are hard deletes.
- **Partner:** No FK from Event.partnerId to Partner (partnerId is String?).
- **Pagination:** List endpoints (e.g. admin applications, leads) use `.take(200)` or no limit; consider consistent limits for very large tables.

**DB diagram (text):**  
User 1—1 BuilderProfile, 1—1 FounderProfile; User 1—* Project (ownerUserId), Application, IntroRequest, Reward, EventRsvp, EventReminder. Application *—1 Event (optional). Event 1—* EventRsvp, EventReminder, Application. Partner standalone. Lead standalone.

---

## C) SECURITY AUDIT

### C1) Authentication & Session Safety — **PASS**

- NextAuth: `lib/auth.ts` — Google + GitHub providers, JWT strategy, callbacks for role/id/onboardingComplete.
- Session validated in server actions and API routes via `getServerSession(authOptions)`.
- No sensitive secrets in client components (only next-auth in node_modules uses `process.env` for NEXTAUTH_URL; app code uses auth from lib).
- Cookies: NextAuth default (httpOnly, secure in prod); no custom cookie code in repo.

### C2) RBAC / Authorization — **PASS**

- **Middleware:** `middleware.ts` — withAuth, admin routes require `token?.role === "ADMIN"`, redirect to `/app`.
- **Server actions:** Admin-only actions check `session?.user.role !== "ADMIN"` (events, admin, rewards).
- **Profile/Project:** Profile upsert uses `session.user.id` only (own profile). Project create uses `session.user.id` as owner. No update/delete project in app/actions/project.ts (only create).
- **API routes:** `/api/admin/events/[id]/export-rsvps` and `.../rsvps` check `session?.user.role !== "ADMIN"`.
- **Event RSVP:** Uses `session.user.id` for userId.

### C3) Input Validation — **PASS**

- Zod used in: `application.ts`, `events.ts`, `deck-waitlist.ts`, `contact.ts`, `admin.ts` (partner), `rewards.ts`, `intro.ts`, `profile.ts`, `project.ts`.
- Mutations use schema `.safeParse()` and whitelisted fields (no mass assignment from raw formData).

### C4) CSRF / Request Integrity — **PASS**

- Next.js server actions and route handlers use same-origin + NextAuth session; `allowedOrigins` in `next.config.mjs` (localhost, webcoinlabs.com, app.webcoinlabs.com). No custom CSRF token; reliance on SameSite cookies and origin restriction is acceptable for this stack.

### C5) Rate Limiting — **PARTIAL**

- **Present:** `lib/rateLimit.ts` (in-memory). Used in: `application.ts` (5/min per user), `deck-waitlist.ts` (3/min per email), `contact.ts` (3/min per email), `intro.ts` (5/min per user).
- **Missing:** Rate limits on event RSVP, event create/update (admin), login (handled by NextAuth/IdP). Recommendation: add rate limit for RSVP and optionally for admin event mutations; document that in-memory limit does not persist across instances (use Redis/Upstash for production).

### C6) Secrets & Environment Variables — **PASS**

- `.env` and `.env.*` in `.gitignore`. `.env.example` documents DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, Google/GitHub OAuth. No secrets in client bundles; `process.env` in app code is server-side (lib/auth, actions, API routes).

### C7) SQL/ORM Safety — **PASS**

- No `$queryRaw` / `$executeRaw` in app or lib; only Prisma typed API. List queries use `findMany` with take limits where applicable (e.g. leads take 200).

### C8) XSS / Content Sanitization — **PASS**

- No `dangerouslySetInnerHTML` in `app/` or `components/`. Event description/agenda rendered as `<pre>` text (no HTML). User content in CSV export escaped (double-quote). No rich markdown renderer in scope; if added later, use a sanitized markdown lib.

### C9) File Upload Security — **N/A**

- No file upload implementation found (logos/avatars are URLs in DB). If uploads are added: restrict types, size, store in bucket, use signed URLs.

### C10) Headers & Security Config — **FAIL**

- `next.config.mjs` has no security headers. **Recommendation:** Add headers in `next.config.mjs` or middleware: Content-Security-Policy (e.g. default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' for Next; frame-ancestors if needed for Calendly), X-Frame-Options: DENY or SAMEORIGIN, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy, Strict-Transport-Security in production.

### C11) Logging & Error Handling — **PARTIAL**

- Server actions return `{ success: false, error: message }` or throw; no stack traces in responses. No centralized error boundary or global error page reviewed; ensure error.tsx / global-error do not expose stack or secrets in production.

---

## D) AUTOMATED CHECKS

| Check | Result |
|-------|--------|
| `dangerouslySetInnerHTML` in app/components | None found |
| `eval(` in app/components/lib | None in app code |
| `process.env` in client components | Only in node_modules (next-auth); app code server-only |
| Raw SQL (`$queryRaw`, `$executeRaw`) in app/lib | None |
| Server actions without auth | Contact, deck-waitlist are public by design; all other mutations check session |
| TODO/FIXME security | `app/actions/events.ts`: "TODO: enqueue emails for T-24h and T-1h" (stub only) |
| Admin routes without guard | All admin pages use getServerSession + role check; middleware redirects non-admin from `/app/admin` |

---

## E) SECURITY FINDINGS TABLE

| Severity | File path | Description | Fix |
|----------|-----------|-------------|-----|
| Medium | `next.config.mjs` | No security headers (CSP, X-Frame-Options, etc.) | Add `headers()` in next.config or middleware with CSP, X-Frame-Options, Referrer-Policy, HSTS (prod) |
| Low | `app/actions/events.ts` | No rate limit on RSVP or createEvent | Add rateLimit(rateLimitKey(session.user.id, "event-rsvp"), 10, 60_000) for rsvpEvent; optional for admin create |
| Low | `app/(marketing)/insights` | No `/insights/[slug]` route | Add dynamic route or redirect insight links to existing pages (e.g. /webcoin-labs-2-0) to avoid 404s |
| Info | `lib/rateLimit.ts` | In-memory store | For production multi-instance, use Redis/Upstash and document |

---

## F) ROUTE MAP (REQUIRED ROUTES CONFIRMED)

| Route | Exists |
|-------|--------|
| `/` | ✅ |
| `/products` | ✅ |
| `/services` | ✅ |
| `/network` | ✅ |
| `/builders` | ✅ |
| `/builders/[handleOrId]` | ✅ |
| `/projects` | ✅ |
| `/projects/[slugOrId]` | ✅ |
| `/pitchdeck` | ✅ |
| `/insights` | ✅ |
| `/insights/[slug]` | ❌ |
| `/contact` | ✅ |
| `/build` | ✅ |
| `/ecosystems` | ✅ |
| `/case-studies` | ✅ |
| `/webcoin-labs-2-0` | ✅ |
| `/login` | ✅ |
| `/app` | ✅ |
| `/app/profile` | ✅ |
| `/app/projects` | ✅ |
| `/app/projects/new` | ✅ |
| `/app/apply` | ✅ |
| `/app/applications` | ✅ |
| `/app/intros` | ✅ |
| `/app/intros/new` | ✅ |
| `/app/rewards` | ✅ |
| `/app/events` | ✅ |
| `/app/events/[id]` | ✅ |
| `/app/events/calendar` | ✅ |
| `/app/events/mine` | ✅ |
| `/app/admin` | ✅ |
| `/app/admin/events` | ✅ |
| `/app/admin/events/new` | ✅ |
| `/app/admin/events/[id]` | ✅ |
| `/app/admin/leads` | ✅ |
| `/app/admin/partners` | ✅ |
| `/app/admin/intros` | ✅ |
| `/app/admin/moderation` | ✅ |
| `/app/admin/rewards` | ✅ |
| `/api/auth/[...nextauth]` | ✅ |
| `/api/admin/events/[id]/export-rsvps` | ✅ |
| `/api/admin/events/[id]/rsvps` | ✅ |
| `/app/events/[id]/ical` | ✅ (GET) |

---

## G) IMPLEMENTATION COVERAGE SUMMARY

| Area | Result | Missing / notes |
|------|--------|------------------|
| **Website** | **PASS** | Add `/insights/[slug]` or fix links to avoid 404; confirm _legacy asset paths if required |
| **Platform** | **PASS** | — |
| **Admin** | **PASS** | — |
| **Events** | **PASS** | — |

---

## H) PATCH PLAN

1. **Security headers (Medium)**  
   - **File:** `next.config.mjs`  
   - Add async `headers()` returning array of `{ source: "/(.*)", headers: [ { key: "X-Frame-Options", value: "SAMEORIGIN" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, { key: "Permissions-Policy", value: "..." } ] }`. Add CSP appropriate for Next + Calendly iframe. In production, add Strict-Transport-Security.

2. **Rate limit event RSVP (Low)**  
   - **File:** `app/actions/events.ts`  
   - In `rsvpEvent`, after `getServerSession`, call `rateLimit(rateLimitKey(session.user.id, "event-rsvp"), 10, 60_000)` and return error if `!rl.ok`.

3. **Insights slug 404 (Low)**  
   - **Option A:** Add `app/(marketing)/insights/[slug]/page.tsx` that resolves slug to content or redirects.  
   - **Option B:** Change links in `insights/page.tsx` and homepage to point to existing URLs (e.g. `/webcoin-labs-2-0` for announcement) so no 404.

4. **Optional: Event create rate limit**  
   - **File:** `app/actions/events.ts`  
   - In `createEvent`, add rate limit by admin userId (e.g. 20/hour) to reduce abuse.

---

## I) FINAL READINESS SCORE

**Score: 82/100**

- **Breakdown:** Features and RBAC/auth/validation are strong (+60). Deductions: no security headers (-8), rate limits not on all mutation paths (-5), insights [slug] 404 (-3), optional soft delete / Partner FK / doc (-2).
- **Blockers to production:**  
  1. Add security headers (CSP, X-Frame-Options, Referrer-Policy, HSTS in prod).  
  2. Ensure `.env` is never committed and NEXTAUTH_SECRET is strong.  
  3. Resolve or redirect `/insights/*` links so users do not hit 404.

---

## J) JSON ARTIFACT

See `audit-artifact.json` in repo root (generated below).
