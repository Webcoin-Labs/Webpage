# Webcoin Labs

<p align="center">
  <img src="public/brand/watermark.svg" alt="Webcoin Labs" width="160" />
</p>

<p align="center">
  <strong>Builder-first innovation hub and venture studio</strong><br />
  <em>Formerly Webcoin Capital</em>
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" /></a>
  <a href="https://www.prisma.io"><img src="https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma" alt="Prisma" /></a>
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel" alt="Vercel" /></a>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [User Roles](#user-roles)
- [Public Routes](#public-routes)
- [Deployment](#deployment)
- [Legacy Notes](#legacy-notes)

---

## Overview

**Webcoin Labs** connects founders and builders, accelerates product development, and delivers funding readiness with AI-powered analysis and ecosystem access. The platform provides:

- **Founder workspace** — Live profile, project, intro, and hiring flows in one shared operating layer.
- **Builder workflow** — Real jobs, founder hiring inboxes, and recommendation feeds with profile-based matching.
- **AI readiness engine** — Pitch deck uploads, extraction, Gemini-powered analysis, moderation, and retry logic.
- **Network execution** — Events, partner access, and KOL/VC intro operations with admin controls.

---

## Features

| Area | Capabilities |
|------|--------------|
| **Auth** | NextAuth.js with Google & GitHub OAuth, email/password, username login, password reset (Resend or webhook) |
| **Profiles** | Builder (handle, skills, chains, open to work), Founder (company, projects), Investor (basic) |
| **Projects** | Create, edit, list; filter by chain and stage (Idea / MVP / Live); public directory |
| **Intros** | KOL and VC intro requests; admin review and targeting |
| **Pitch decks** | Upload PDF/DOCX → extract text → AI analysis (Gemini), moderation, status tracking |
| **Jobs** | Job posts (founders), applications (builders), roles (full-time, contract, cofounder, etc.), locations (remote, hybrid, onsite) |
| **Hiring** | Founders post hiring interests; builders express interest; admin hiring interests dashboard |
| **Events** | Create events (office hours, workshops, demo days), RSVP, reminders (webhook), calendar |
| **Storage** | R2 (S3-compatible) or local; avatars, company logos, pitch deck files; upload moderation |
| **Admin** | Applications, intros, leads, jobs, pitch decks, storage health, upload moderation, hiring interests |

### AI & Integrations

- **Pitch analysis** — Google Gemini; optional async queue via internal job drain.
- **Recommendations** — Builder–founder matching, GTM checklist, fundraising readiness.
- **Notifications** — Event reminders, password reset (Resend or webhook).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5.7 |
| **Styling** | Tailwind CSS, shadcn/ui (Radix), tailwindcss-animate |
| **Animation** | Framer Motion, @tsparticles (hero effects) |
| **Database** | Neon Postgres (serverless) |
| **ORM** | Prisma 5.x |
| **Auth** | NextAuth.js 4 (OAuth + credentials) |
| **Storage** | Cloudflare R2 (S3-compatible) or local filesystem |
| **AI** | Google Generative AI (Gemini) for pitch deck analysis |
| **Deployment** | Vercel |

---

## Screenshots

| Page | Description |
|------|-------------|
| **Homepage** | Hero, problem/solution grids, products, builder highlights, strategy call CTA |
| **Builders** | Directory of builder profiles with skills and chain focus |
| **Projects** | Directory of projects with filters by chain and stage |
| **Pitch deck** | Upload form and AI-generated readiness report |
| **App portal** | Dashboard, profile, projects, intros, jobs, hiring, events |

> Add screenshots to `docs/screenshots/` and link them here for a visual overview.

---

## Project Structure

```
webcoinlabs/
├── app/
│   ├── (marketing)/          # Public site
│   │   ├── page.tsx          # Homepage
│   │   ├── builders/         # Builder directory & profile pages
│   │   ├── projects/         # Project directory & project pages
│   │   ├── ecosystems/       # Ecosystem tracks (Base, Arc, …)
│   │   ├── network/          # Partners, VCs, launchpads
│   │   ├── products/         # ArcPay, RiddlePay, Kreatorboard, Founder Profile
│   │   ├── pitchdeck/        # Pitch deck upload & AI review
│   │   ├── pricing/          # Pricing tiers
│   │   ├── contact/          # Contact form
│   │   ├── services/         # Venture studio services
│   │   ├── insights/         # Blog / insights
│   │   └── case-studies/     # Case studies
│   ├── app/                  # Authenticated portal
│   │   ├── page.tsx          # App home
│   │   ├── profile/          # User profile
│   │   ├── projects/         # Create & manage projects
│   │   ├── intros/           # Intro requests (KOL/VC)
│   │   ├── jobs/             # Jobs board & applications
│   │   ├── hiring/           # Hiring interests
│   │   ├── kols-premium/     # KOLs premium
│   │   ├── apply/            # Builder program & founder support applications
│   │   ├── events/           # Events, calendar, RSVP
│   │   ├── messages/         # Messages
│   │   ├── rewards/          # Rewards
│   │   └── admin/            # Admin dashboard (applications, intros, jobs, pitch decks, storage, moderation)
│   ├── api/                  # API routes (auth, internal jobs drain)
│   ├── actions/              # Server actions (auth, profile, project, intro, jobs, hiring, pitchdeck, storage, …)
│   ├── login/                # Login, create account, forgot/reset password
│   ├── auth/                 # Auth sign-in
│   ├── layout.tsx
│   ├── error.tsx
│   └── global-error.tsx
├── components/
│   ├── layout/               # Navbar, Footer
│   ├── common/               # AnimatedSection, ThemeToggle, ProfileAvatar, ProfileAffiliationTag, CompanyLogo
│   ├── home/                 # ProblemRevealGrid, CapabilityRevealGrid
│   ├── products/             # ProductsSection
│   ├── pitchdeck/            # PitchDeckHubClient, PitchDeckUploadForm, RetryAnalysisButton
│   ├── forms/                # ContactForm, JobPostForm, JobApplyForm, StrategyCallForm, HiringInterestForm
│   ├── hiring/               # HiringInterestsTable
│   ├── jobs/                 # JobPostForm, JobApplyForm
│   ├── app/                  # AppSidebar, profile forms, admin tables
│   └── providers/            # ThemeProvider, AuthProvider
├── lib/
│   ├── auth.ts               # NextAuth config
│   ├── prisma.ts             # Prisma singleton
│   ├── env.ts                # Env validation
│   ├── rateLimit.ts          # Rate limiting (Upstash optional)
│   ├── affiliation.ts        # Builder affiliation helpers
│   ├── matching.ts           # Matching logic
│   ├── recommendations.ts    # Recommendation engine
│   ├── ai/                   # Pitch analysis, Gemini provider
│   ├── extraction/           # Deck text extraction (PDF/DOCX)
│   ├── storage/              # R2 & local storage
│   ├── uploads/              # Upload asset handling
│   └── notifications/        # Event reminders, password reset
├── prisma/
│   ├── schema.prisma         # Data model (User, BuilderProfile, FounderProfile, Project, Application, IntroRequest, PitchDeck, JobPost, Event, UploadAsset, …)
│   ├── seed.ts               # Seed data
│   └── migrations/           # SQL migrations
├── public/
│   ├── brand/                # Logo, watermark
│   └── network/              # Partner logos (current, legacy)
├── docs/                     # Production checklist, runbooks
└── scripts/                  # Utilities
```

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Webcoin-Labs/Webpage.git
cd Webpage
pnpm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

See [Environment Variables](#environment-variables) for the full reference.

### 3. OAuth (optional but recommended)

| Provider | Setup |
|----------|--------|
| **Google** | [Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client ID. Redirect URI: `http://localhost:3000/api/auth/callback/google` |
| **GitHub** | [New OAuth App](https://github.com/settings/applications/new). Callback URL: `http://localhost:3000/api/auth/callback/github` |

### 4. Database

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 5. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| **Database** | | |
| `DATABASE_URL` | Yes | Neon Postgres connection string (e.g. `postgresql://...?sslmode=require`) |
| **Auth** | | |
| `NEXTAUTH_SECRET` | Yes | Random secret: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` (local) or production URL |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth client secret |
| **Password reset** | | |
| `RESEND_API_KEY` | No | Resend API key (recommended for production) |
| `PASSWORD_RESET_FROM_EMAIL` | No | Sender email (e.g. `Webcoin Labs <no-reply@webcoinlabs.com>`) |
| `PASSWORD_RESET_WEBHOOK_URL` | No | Alternative: webhook URL for reset emails |
| `PASSWORD_RESET_WEBHOOK_TOKEN` | No | Webhook auth token |
| **AI (pitch analysis)** | | |
| `GEMINI_API_KEY` | Yes (prod) | Google AI / Gemini API key |
| `GEMINI_MODEL` | No | Model override (default: `gemini-1.5-pro`) |
| `PITCH_ANALYSIS_QUEUE_MODE` | No | `sync` (default) or `async` (internal job drain) |
| **Storage** | | |
| `STORAGE_PROVIDER` | Yes | `r2` or `local` |
| `R2_ACCOUNT_ID` | If R2 | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | If R2 | R2 access key |
| `R2_SECRET_ACCESS_KEY` | If R2 | R2 secret key |
| `R2_BUCKET_NAME` | If R2 | Bucket name (e.g. `webcoinlabs-assets`) |
| `R2_ENDPOINT` | If R2 | `https://<accountid>.r2.cloudflarestorage.com` |
| `LOCAL_STORAGE_ROOT` | If local | Absolute path for uploads (e.g. `E:\webcoinlabs\.data`) |
| `PUBLIC_UPLOAD_ROOT` | If local | URL path for local assets (e.g. `/uploads`) |
| **Rate limiting** | | |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis REST token |
| **Internal jobs & reminders** | | |
| `INTERNAL_JOBS_SECRET` | If async jobs | Secret for `/api/internal/jobs/drain` |
| `EVENT_REMINDER_WEBHOOK_URL` | No | Reminder delivery webhook |
| `EVENT_REMINDER_WEBHOOK_TOKEN` | No | Webhook token |
| **Observability** | | |
| `OBSERVABILITY_SINK_URL` | No | Optional logging/observability endpoint |
| `OBSERVABILITY_SINK_TOKEN` | No | Sink auth token |

---

## User Roles

| Role | Access |
|------|--------|
| `BUILDER` | Profile, apply to builder programs, jobs, hiring interests, intros |
| `FOUNDER` | Profile, create/manage projects, apply for founder support, post jobs and hiring interests, intros |
| `INVESTOR` | Basic portal access (future) |
| `ADMIN` | Full access: admin dashboard (applications, intros, leads, jobs, pitch decks, storage, moderation, hiring interests) |

To set a user as **ADMIN** in the database:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```

---

## Public Routes

| Path | Description |
|------|-------------|
| `/` | Homepage |
| `/builders` | Builder directory |
| `/builders/[handleOrId]` | Builder profile |
| `/projects` | Project directory |
| `/projects/[slugOrId]` | Project page |
| `/ecosystems` | Ecosystem tracks |
| `/network` | Partners, VCs, launchpads |
| `/products` | Products overview |
| `/products/arcpay` | ArcPay |
| `/products/riddlepay` | RiddlePay |
| `/products/kreatorboard` | Kreatorboard |
| `/products/founder-profile` | Founder Profile |
| `/pitchdeck` | Pitch deck upload & AI review |
| `/pricing` | Pricing |
| `/contact` | Contact form |
| `/services` | Services |
| `/insights` | Insights / blog |
| `/case-studies` | Case studies |

---

## Deployment

### Vercel

1. Push the repo to GitHub and import the project in [Vercel](https://vercel.com).
2. Add all required environment variables (see [Environment Variables](#environment-variables)).
3. Set **Build Command** to: `pnpm db:generate && pnpm build`.
4. Deploy.

After the first deploy, run migrations against your Neon database (e.g. from CI or locally):

```bash
pnpm db:migrate
# or for production: npx prisma migrate deploy
```

See `docs/PRODUCTION_CHECKLIST.md` and `docs/STAGING_PROD_LAUNCH_RUNBOOK.md` for pre-deploy checks and runbooks.

---

## Legacy Notes

This project replaces the previous Express + MongoDB + Socket.IO stack.

| Removed | Replaced with |
|---------|----------------|
| `server.js` (Express) | Next.js App Router + Server Actions |
| Static HTML (home, portfolio, VC, launchpad, signup) | React pages under `app/(marketing)/` |
| MongoDB / Mongoose | Neon Postgres + Prisma |
| Socket.IO auth | NextAuth.js sessions |
| PHP mail form | Contact form + server actions |

Partner and seed data are in `prisma/seed.ts`; logo assets live under `public/`.

---

## License

Proprietary — Webcoin Labs.
