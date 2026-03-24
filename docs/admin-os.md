# Admin OS

## Purpose
Admin OS operates trust, routing, moderation, and network curation workflows.

## Current Implemented Modules
- Application review
- Intro request status operations
- Partner CRUD
- Builder and project visibility/verification controls
- Upload moderation operations
- Notifications/broadcast operations

## Security and Audit
- Admin actions require explicit role authorization.
- Mutation actions are audit-logged via `MutationAuditLog`.
- Public/role-sensitive data operations are separated from admin/internal operations.

## Phased Compat Direction
Remaining canonical admin modules to complete:
- Assignment/routing queue as first-class model
- Internal note workflow
- Score override/review queue
- Visibility rules and exceptions model
- Data correction and trust review queue

