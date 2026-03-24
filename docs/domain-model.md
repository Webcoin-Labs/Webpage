# Webcoin Labs Domain Model

## Shared Graph Primitives
The platform is modeled as one connected graph, not role-isolated silos.

- Identity: `User`, `BuilderProfile`, `FounderProfile`, `InvestorProfile`
- Workspace access: `UserWorkspace`
- Organizations and ventures: `InvestorCompany`, `InvestorCompanyMember`, `Venture`, `VentureMember`
- Execution artifacts: `BuilderProject`, `PitchDeck`, tokenomics models/scenarios
- Opportunities and applications: `JobPost`, `JobApplication`, `InvestorApplication`
- Communication and meetings: `ChatThread`, `ChatMessage`, `WorkspaceMeeting`, `MeetingRecord`
- Trust and evidence: `GithubConnection`, `WalletConnection`, `UserBadge`, audit logs
- Integrations: `IntegrationConnection`, OpenClaw Telegram sync structures
- Admin and governance: moderation entities, notification/broadcast entities, mutation audit logs

## Canonical vs Legacy (Phased Compat)
- Canonical path preference:
  - Founder/Investor pipeline: `Venture` + `InvestorApplication`
  - Wallet identity: `WalletConnection`
  - Integration state: `IntegrationConnection`
- Legacy path compatibility retained:
  - `Startup`, `Project`, `Investor` legacy models remain operational during transition.

## Planned Canonical Extensions
During remaining migration phases, canonical graph will add/complete:
- Opportunity model unification
- Diligence memo first-class model
- Score snapshot persistence model
- Admin routing assignment model
- Visibility rule + internal note models

## Newly Added Canonical Tables (Additive)
- `ScoreSnapshot`
- `DiligenceMemo`
- `AdminAssignment`
- `VisibilityRule`

## Compatibility Bridges Added
- `Project.canonicalVentureId -> Venture.id`
- `Startup.canonicalVentureId -> Venture.id`
- `Investor.canonicalInvestorProfileId -> InvestorProfile.id`

Backfill command:
- `pnpm db:backfill:canonical`
