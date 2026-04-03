# Webcoin Labs Documentation

This folder is the single source of truth for architecture, setup, and operations.

## Start Here

1. [System Design](./architecture/system-design.md)
2. [Repository Structure](./architecture/folder-structure.md)
3. [Deployment Architecture](./architecture/deployment-architecture.md)
4. [Request and Data Flows](./architecture/request-flows.md)
5. [Integrations Setup](./operations/integrations-setup.md)
6. [Auth Architecture](./auth-architecture.md)
7. [Domain Model](./domain-model.md)
8. [Roles and Permissions](./roles-and-permissions.md)
9. [Release Checklist](./release-checklist.md)

## Documentation Map

### Architecture
- `architecture/system-design.md` - end-to-end system design and runtime components
- `architecture/folder-structure.md` - folder ownership and engineering boundaries
- `architecture/deployment-architecture.md` - local/staging/production deployment and callback topology
- `architecture/request-flows.md` - auth, onboarding, integrations, and posting flows
- `architecture.md` - compatibility and migration summary

### Product and Domain
- `domain-model.md` - canonical entities and compatibility bridges
- `roles-and-permissions.md` - role matrix and enforcement layers
- `scoring-system.md` - scoring semantics and interpretation

### Operations
- `operations/integrations-setup.md` - provider setup, callback URLs, and plugin readiness
- `INTEGRATIONS_SETUP.md` - compatibility pointer to the canonical operations guide
- `release-checklist.md` - pre-release and deployment gates

## Rules

- Keep docs additive and migration safe.
- Preserve route contracts unless a documented redirect is added.
- Do not delete compatibility docs until replacements are verified in staging.
