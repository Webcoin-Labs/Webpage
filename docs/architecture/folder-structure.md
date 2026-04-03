# Repository Structure

This map defines where code should live and what each folder owns.

## Top-Level Structure

```text
E:\webcoinlabs
|- app/                  Next.js routes, layouts, API handlers, server actions
|- components/           Reusable UI and feature components
|- lib/                  Shared runtime libraries (auth, storage, integrations, utils)
|- server/               Policies, selectors, and server-only domain logic
|- prisma/               Schema and migrations
|- docs/                 Architecture, setup, and operational guides
|- tests/                Unit and integration tests
|- scripts/              Utility scripts and one-off maintenance tooling
|- public/               Static assets
|- features/             Domain feature modules
```

## App Router Organization

```text
app/
|- (marketing)/          Public marketing pages
|- app/                  Authenticated app shell and role workspaces
|  |- founder-os/
|  |- builder-os/
|  |- investor-os/
|  |- onboarding/
|  |- profile/
|  |- settings/
|  |- ecosystem-feed/
|- api/                  Route handlers for integrations, exports, uploads, jobs
|- auth/                 Auth callback routes
|- login/                Login and account entry points
|- founder/              Public founder profile pages
|- builder/              Public builder profile pages
|- investor/             Public investor profile pages
```

## Server Ownership Boundaries

- `app/actions/*`
  - mutation entry points
  - call policy checks before writes
  - call selectors/services for complex reads

- `server/policies/*`
  - authorization rules
  - role and ownership checks

- `server/selectors/*`
  - typed read models
  - public-safe field selection

- `lib/*`
  - framework adapters and shared libraries
  - auth, storage, integrations, notifications, startup hub adapter

## Documentation Folder Order

```text
docs/
|- README.md
|- architecture/
|  |- system-design.md
|  |- folder-structure.md
|  |- request-flows.md
|- operations/
|  |- integrations-setup.md
|- auth-architecture.md
|- domain-model.md
|- roles-and-permissions.md
|- release-checklist.md
|- scoring-system.md
|- architecture.md
```

## Implementation Rules

- Add new product behavior in the appropriate workspace route and action.
- Do not duplicate business rules in page components.
- Put access control in policy helpers, not in JSX.
- Keep plugin/provider logic in `lib/integrations/*`.
