# Legacy Achievements + Partner Logos + Two Pitch Decks — Deliverables

## 1) Partner & seed counts (after `pnpm db:seed`)

| Metric | Count |
|--------|--------|
| **Total partners** | 43 |
| **CURRENT** | 20 |
| **Featured CURRENT** | 22 |
| **LEGACY** | 23 |

- Seed defines partners with `logoPath` pointing to `/network/current/...` or `/network/legacy/...` under `public/`.
- At least 20 featured CURRENT partners across categories (VC, Launchpad, CEX, Portfolio, Media, Guild).

---

## 2) Homepage slider: DB-driven, watermark, marquee

- **Section**: “Trusted by / Our Network” with official, premium look.
- **Background**: Faint repeating watermark via `/public/brand/watermark.svg` (opacity ~0.06).
- **Content**: Horizontal marquee of partner logos:
  - Auto-scroll (CSS animation), pause on hover, infinite loop.
  - Logos grayscale by default; full color on hover.
- **Data**: From Prisma: `featured === true && status === "CURRENT"` (no hardcoded list).
- **Link**: “View full network” → `/network`.

---

## 3) Pitch deck hub: two decks

- **URL**: `/pitchdeck` (hub).
- **Card A — Services Deck (Legacy, 2023)**  
  - Title: “Webcoin Labs — Services Deck (Legacy, 2023)”.  
  - PDF: `/public/pitchdeck/webcoin-services-2023.pdf` (copy from “Webcoin Labs - Pitch Deck v1.pdf” if needed).  
  - Buttons: View, Download.
- **Card B — Builders & Founders 2.0**  
  - “Coming soon” plus “Notify me” form.  
  - On submit: creates a **Lead** with `source = "DECK_WAITLIST_BUILDERS"`.  
  - Admin can see these in `/app/admin/leads` (source badge shown).

---

## 4) Watermark

- **Asset**: `/public/brand/watermark.svg` (simple “W” outline).
- **Usage**:
  - Partners slider section: repeating background, low opacity (0.04–0.08 range).
  - Footer: optional subtle repeating background (~0.03 opacity).
- Readability: opacity kept very low so it does not hurt contrast.

---

## 5) Asset copy script (no moving, only copy)

- **Script**: `scripts/copy-legacy-logos.mjs`.
- **Source**: `_legacy/vcs`, `_legacy/launchpad`, `_legacy/logo-designs/New Design of logo` (selected portfolio logos only).
- **Destination** (all under `public/`):
  - `public/network/current/vc`, `public/network/current/launchpads`
  - `public/network/legacy/vc`, `public/network/legacy/launchpads`, `public/network/legacy/portfolio`
- Originals in `_legacy` are **not** deleted or moved; website uses only `/public` assets.
- Run: `node scripts/copy-legacy-logos.mjs`.

---

## 6) Network page

- **Tabs**: Current vs Legacy (unchanged).
- **Category chips**: VC, Launchpads, CEX, Portfolio, Media, Guild (in `PartnerGrid`).
- **Content**: “All partners” grid; data from DB by tab and category.

---

## 7) Legacy credibility (2021–2023)

- **Full section**: On `/webcoin-labs-2-0`, section “2021–2023: What we achieved” (id `#achievements`):
  - Community growth & distribution.
  - Network depth (launchpads, CEX, VCs, KOL network).
  - Portfolio support (selected).
  - Work types: partnerships, onboarding, campaigns, advisory, allocations — factual, no listing/funding guarantees.
  - CTA: “Legacy network” → `/network?tab=legacy`.
- **Homepage**: Short “Legacy credibility” block with link to full story (`/webcoin-labs-2-0#achievements`).

---

## 8) Hero & footer

- **Hero**: “View Pitch Decks” → `/pitchdeck`.
- **Footer**: “Pitch Decks” link to `/pitchdeck`.

---

## 9) Admin partners

- In `/app/admin/partners`: toggles/edits for **featured**, **status**, **category**, **url**, and logo path so curation can be done without code changes.

---

## Validation checklist

1. **Counts**: Print after seed — total partners, current, featured current, legacy (see table above).
2. **Homepage slider**: Loads logos from DB (featured + CURRENT); no hardcoded list.
3. **Pitch deck hub**: Both cards present; one active (View/Download), one “Coming soon” + Notify → Lead with `DECK_WAITLIST_BUILDERS`.
4. **Watermark**: Applied in partner section (and optionally footer); opacity low so readability is not hurt.
