# Scoring System

## Principles
- No black-box global score.
- Scores are explainable with explicit factors.
- Labels over false precision: `strong`, `moderate`, `missing`, `under_review`.
- All score outputs are computed from real stored data.

## Implemented Engines
Implemented in:
- `features/scoring/engine.ts`
- `server/services/scoring.service.ts`

### Founder Launch Readiness
Signals include:
- Founder profile presence
- Venture workspace presence
- Pitch deck availability
- Investor application activity
- Meeting momentum
- Execution update consistency

### Builder Proof Score
Signals include:
- Profile depth
- GitHub identity linked
- Project count
- Repository evidence
- Live deployment evidence
- Resume availability
- Activity consistency
- Badge/reference presence

### Investor Fit Helper
Signals include:
- Chain match
- Stage match
- Sector relevance
- Application engagement
- Meeting progress
- Diligence signal depth

## Output Shape
Each score exposes:
- `score` (0-100)
- `label`
- `factors[]` with weights/status/reasons
- `lastComputedAt`
- `sourceVersion`

