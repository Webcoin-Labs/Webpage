# Integrations

## Integration Architecture
Integration state is tracked per user in `IntegrationConnection` with:
- `provider`
- `status`
- token metadata placeholders
- sync metadata

Canonical integration helper:
- `server/services/integration.service.ts`

## Providers in Scope
- GitHub
- Gmail
- Google Calendar
- Cal.com / Calendly
- Notion
- Jira
- Farcaster

## GitHub Truthfulness
- Manual GitHub ingest now records `accessMode=manual_sync` instead of mock labels.
- Repository evidence is explicitly tagged as manually synced where applicable.
- Future phase adds OAuth token + periodic sync provenance.

## Internal Worker Integrations
- OpenClaw Telegram sync worker: `app/api/internal/jobs/openclaw-sync/route.ts`
- Tokenomics import worker: `app/api/internal/jobs/tokenomics-import/route.ts`
- Both require internal shared-secret authentication.

