# Roles and Permissions

## Roles
- `BUILDER`
- `FOUNDER`
- `INVESTOR`
- `ADMIN`

## Role Model
- One account can have multiple workspace memberships (`UserWorkspace`).
- Workspace selection sets active context.
- Existing route compatibility still uses role checks in some paths; migration is in progress to workspace-aware policy checks.

## Enforcement Layers
1. Middleware:
   - Protects authenticated `/app/*` access.
   - Guards admin route namespace.
2. Server actions and API handlers:
   - Must validate actor identity and capabilities.
   - Use central policy helpers in `server/policies/authz.ts`.
3. Selectors:
   - Public selectors only expose explicitly selected fields.
   - Investor-only contact visibility is policy-gated.

## Admin Guarantees
- Admin mutation actions are audit-logged.
- Admin visibility/verification actions are explicit and scoped.
- Internal job routes require `INTERNAL_JOBS_SECRET`.

