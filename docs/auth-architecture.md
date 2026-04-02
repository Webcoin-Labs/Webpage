# Webcoin Labs Auth Architecture

## Overview

Webcoin Labs now treats authentication and product identity as separate concerns.

- Supabase Auth handles authentication only:
  - email OTP / magic link
  - GitHub OAuth
  - session cookies
  - auth callback exchange / verification
- The application database remains the source of truth for product identity:
  - `User`
  - roles
  - onboarding state
  - founder / builder / investor profiles
  - premium state
  - ownership of ventures, pitch decks, integrations, feed posts, and settings

## Identity Mapping

Authenticated users are mapped like this:

`Supabase user -> User.supabaseAuthId -> internal app user record`

The `User` model now includes:

- `supabaseAuthId`
- `authProvider`

On successful Supabase login:

1. the callback exchanges the auth code or verifies the OTP token
2. the authenticated Supabase user is loaded
3. the app looks up an internal user by `supabaseAuthId`
4. if no match exists, it falls back to matching by normalized email
5. if still no match exists, a new internal `User` is created
6. safe metadata is synced:
   - email
   - email verification timestamp
   - provider
   - display name when internal name is blank
   - avatar when internal image is blank

Existing internal fields are preserved:

- username
- role
- onboarding progress
- premium subscription state
- profile visibility
- all related profile and ownership relations

## Route Protection

`middleware.ts` now supports two modes:

- Supabase mode when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured
- legacy NextAuth fallback when Supabase is not configured

Protected routes:

- `/app/*`
- `/api/profiles/contact/*`

Admin authorization remains enforced inside the server-rendered pages and server actions using the internal user role.

## Login Flow

Primary login options:

- email magic link
- GitHub OAuth

Callback URL:

- `/auth/callback`

After callback:

- incomplete users are redirected to `/app/onboarding`
- completed users are redirected to their requested path or role workspace

## Environment Variables

Required for Supabase Auth:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXTAUTH_URL`

Legacy fallback variables kept temporarily:

- `NEXTAUTH_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Migration Notes

- NextAuth-backed account/password flows are kept temporarily for compatibility and local/test fallback.
- Product identity has not moved out of Prisma.
- Public profiles, ownership checks, premium rules, onboarding, and role routing continue to resolve against the internal `User` model.
