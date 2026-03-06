# Webcoin Labs 2.0

> Builder-first innovation hub and venture studio. Formerly Webcoin Capital.

## Tech Stack

- **Framework**: Next.js 14 App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Animation**: Framer Motion
- **Database**: Neon Postgres (serverless)
- **ORM**: Prisma
- **Auth**: NextAuth.js (Google + GitHub OAuth)
- **Deployment**: Vercel

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/webcoinlabs/webcoinlabs-2.git
cd webcoinlabs-2
pnpm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required:
| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `NEXTAUTH_SECRET` | Random secret (run `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `http://localhost:3000` for local |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |

### 3. Set up OAuth

**Google:** [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client ID
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

**GitHub:** [github.com/settings/applications/new](https://github.com/settings/applications/new)
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

### 4. Database setup

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations (Neon Postgres)
pnpm db:migrate

# Seed partners and data
pnpm db:seed
```

### 5. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
├── (marketing)/     # Public site (/, /build, /ecosystems, /network, ...)
├── app/             # Authenticated portal (/app/*)
├── api/auth/        # NextAuth handler
├── actions/         # Server actions (contact, application, profile, project, admin)
├── login/           # Login page
├── sitemap.ts
├── robots.ts
└── layout.tsx       # Root layout

components/
├── layout/          # Navbar, Footer
├── common/          # AnimatedSection, HeroBackground, ThemeToggle, StatsCounter
├── partners/        # PartnerGrid
├── forms/           # ContactForm
├── app/             # AppSidebar, BuilderProfileForm, FounderProfileForm, AdminApplicationsTable
└── providers/       # ThemeProvider, AuthProvider

prisma/
├── schema.prisma    # Full data model
└── seed.ts          # Legacy partner seed data

lib/
├── auth.ts          # NextAuth config
├── prisma.ts        # Prisma singleton
└── utils.ts         # cn() utility
```

---

## Deploy to Vercel

1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add all environment variables
4. Override build command: `pnpm db:generate && pnpm build`
5. Deploy

> **Important**: After first deploy, run migrations on Neon via `pnpm db:push` or set up auto-migrate in the Vercel build step.

---

## User Roles

| Role | Access |
|---|---|
| `BUILDER` | Profile, apply to builder programs |
| `FOUNDER` | Profile, create projects, apply for founder support |
| `INVESTOR` | Basic portal access (future) |
| `ADMIN` | Full access including admin dashboard |

To set a user as ADMIN, update directly in Neon DB:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```

---

## Legacy Migration Notes

This project replaces the old Express + MongoDB + Socket.IO codebase.

Removed:
- `server.js` (Express)
- `home.html`, `portfolio.html`, `VC.html`, `launchpad.html`, `signup.html`
- MongoDB/Mongoose
- Socket.IO auth
- PHP mail form

Migrated:
- Partner lists → Prisma seed (`prisma/seed.ts`)
- Logo assets → `/public`
