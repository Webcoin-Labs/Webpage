# Webcoin Labs Architecture

## Current Architecture (Phased Compat)
Webcoin Labs is implemented as a shared-graph Next.js application with role-filtered operating views:
- Founder OS
- Builder OS
- Investor OS
- Admin OS

The app currently runs a **phased compatibility** strategy:
- Canonical shared entities (`User`, `Venture`, `InvestorApplication`, `WalletConnection`, `IntegrationConnection`) are active.
- Legacy entities (`Startup`, `Project`, legacy investor structures) remain read-compatible for existing routes.
- New policy/service layers are additive and progressively replacing direct page-level Prisma usage.

## Runtime Layers
- `app/*`: route surfaces and route handlers.
- `app/actions/*`: server actions for mutation flows.
- `server/policies/*`: centralized authz checks.
- `server/services/*`: typed domain services and adapters.
- `server/selectors/*`: role-safe/public-safe read selectors.
- `features/*`: domain logic modules (scoring currently).

## Security Model
- Middleware provides coarse route protection.
- Sensitive action authorization is enforced in server actions + policy helpers.
- Public profile selectors restrict to explicitly selected fields.
- Internal/background routes use shared-secret authorization.

## Compatibility Strategy
1. Keep working route contracts and data shape compatibility.
2. Route new mutations through service contracts where introduced.
3. Move read paths to selectors and service queries.
4. Remove legacy duplication after parity and migration backfill are complete.

