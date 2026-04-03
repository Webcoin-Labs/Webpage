# System Design

## Platform Shape

Webcoin Labs is a role-aware ecosystem hub with one shared graph:
- Builder identity and proof
- Founder startup pages and execution
- Investor discovery and review
- Shared execution feed
- Utility tools: Pitch Deck and Tokenomics

The platform uses Supabase for authentication and Prisma/Postgres for product data.

## Runtime Architecture

```mermaid
flowchart TB
    Browser["Web Browser"] --> App["Next.js App Router"]
    App --> Middleware["middleware.ts"]
    App --> Actions["Server Actions"]
    App --> Routes["API Route Handlers"]

    Middleware --> SupabaseAuth["Supabase Auth Session"]
    Actions --> AuthLib["lib/auth.ts"]
    Routes --> AuthLib
    AuthLib --> SupabaseAuth

    Actions --> Policy["server/policies/authz.ts"]
    Routes --> Policy

    Actions --> Prisma["Prisma Client"]
    Routes --> Prisma
    Prisma --> DB[("PostgreSQL")]

    Actions --> Storage["lib/storage/*"]
    Routes --> Storage
    Storage --> R2["Cloudflare R2 or Local Storage"]

    Actions --> Integrations["lib/integrations/*"]
    Routes --> Integrations
    Integrations --> Providers["OAuth and Native Providers"]

    Actions --> Notifications["lib/notifications/*"]
```

## Role Surfaces

```mermaid
flowchart LR
    Hub["/app (shared hub)"] --> Founder["/app/founder-os/*"]
    Hub --> Builder["/app/builder-os/*"]
    Hub --> Investor["/app/investor-os/*"]

    Founder --> Startup["Startup and Venture Layer"]
    Founder --> Pitch["Pitch Deck Workspace"]
    Founder --> Tokenomics["Tokenomics Workspace"]

    Builder --> Proof["Proof Profile"]
    Builder --> Projects["Projects and GitHub Import"]
    Builder --> Opportunities["Opportunity Inbox"]

    Investor --> Discovery["Discovery and Saved Startups"]
    Investor --> Review["Deck and Tokenomics Review"]
    Investor --> Intro["Intro and Meeting Requests"]
```

## Security and Ownership

- Authentication is externalized to Supabase.
- Product identity remains internal (`User` and role profiles).
- Authorization is enforced in server actions and route handlers.
- Ownership checks gate edits to profiles, ventures, decks, and tokenomics.
- Public profile routes are read-safe and visibility-aware.

## Design Constraints

- Keep routes stable.
- Prefer additive refactors over destructive rewrites.
- Keep shared graph entities canonical, and legacy bridges temporary.
