# Homepage + UI Improvements — Deliverables

## 1) Homepage sections (in order)

1. **Hero** — “Introducing Webcoin Labs 2.0” + “Formerly Webcoin Capital”; CTAs: Enter App, Partner With Us, **View Pitch Deck**; stats row
2. **Three pillars** — Identity, Discovery, Access (with contrast fixes)
3. **What we provide** — 6 service cards (bento): Programs & Cohorts, Venture Studio Support, Capital Readiness, Ecosystem Access, Community & Distribution, Talent Matching (each with Apply / Explore)
4. **Trusted Network** — “Trusted Network” + subtitle; 12–24 featured CURRENT partners from DB; category filter chips (VC, Launchpads, Exchanges, Guilds, Media, Portfolio); grayscale → hover full color; “View full network” → /network
5. **Explore the ecosystem** — “Browse Builders” → /builders, “Browse Projects” → /projects
6. **Built through cycles** — “Built through cycles”; 3 columns: Legacy network (2021–2023) → /network?tab=legacy, Rebuilt for builders (2026) → /webcoin-labs-2-0, Programs-first model → /build; optional “Selected portfolio” strip (PORTFOLIO partners)
7. **How we work** — 4 steps: Apply, Align, Build, Ship & Amplify; improved contrast; “Apply Now” → /app/apply
8. **Webcoin Labs 2.0 snippet** — Preview card → /webcoin-labs-2-0
9. **Insights** — Latest from Webcoin Labs → /insights
10. **Contact CTA** — “Ready to build together?”; Apply to a Program, Partner With Us

---

## 2) Partner showcase (DB + count)

- **Query:** `Partner` where `featured === true` AND `status === "CURRENT"`, ordered by `sortOrder`, limit 24.
- **Seed:** 14 partners are CURRENT + featured (Animoca Brands, Base, Polygon, Morningstar Ventures, 3Commas Capital, Lotus Capital, DAO Maker, GameFi, Seedify, KuCoin, Gate.io, Yield Guild Games, Crypto Banter, Altcoin Buzz).
- **Shown:** Up to 24; with current seed, **14** featured CURRENT partners are shown in the Trusted Network section.

---

## 3) Pitch deck route and file

- **Route:** `/pitchdeck` (under marketing layout: nav + footer).
- **File path:** `public/pitchdeck/webcoin-labs-pitchdeck.pdf`
- **Page:** Title “Webcoin Labs — Pitch Deck”; disclaimer “Legacy deck (2023). Updating for 2.0.”; Open/Download PDF button; embedded PDF viewer with fallback download link.
- **Note:** Place the file “Webcoin Labs - Pitch Deck v1.pdf” in `public/pitchdeck/` and rename to `webcoin-labs-pitchdeck.pdf` (or update `PDF_PATH` in `app/(marketing)/pitchdeck/page.tsx` to match the actual filename).

---

## 4) Contrast and UI fixes (tokens/classes)

- **Headings:** Added or kept `text-foreground` on: Three pillars title, pillar cards (h3), What we provide title, How we work title, step titles, Built through cycles titles, Insights title, Contact CTA title, WL 2.0 card title, insight card titles.
- **Cards:** Stronger borders: `border` → `border-2` and/or `border-border/60` on pillars, service cards, insight cards, How we work steps, Built through cycles columns; hover `border-cyan-500/40` or similar.
- **Buttons:** Primary CTAs use `shadow-lg shadow-cyan-500/20`; secondary use `border-2` and `text-foreground/90` for clearer edges and text.
- **How we work:** Step numbers `text-muted/30` → `text-foreground/90`; step text `text-muted-foreground` kept for body; step cards get `bg-card/80` and `border border-border/50`; “Apply Now” uses `border-2 border-violet-500/40` and `font-semibold`.
- **Stats labels:** `text-muted-foreground` → `text-foreground/80`.
- **Pillars:** Card borders `border` → `border-2`, gradient borders `border-cyan-500/20` → `border-cyan-500/30` (and equivalent for violet/amber).

---

## 5) Footer and nav

- **Footer — Platform:** Added “Pitch Deck” → /pitchdeck.
- **Footer — Portal:** Enter App → /app; Apply — Builder → /app/apply/builder-program; Apply — Founder → /app/apply/founder-support; Browse Builders → /builders; Browse Projects → /projects.
- **Nav:** Added “Pitch Deck” → /pitchdeck.

---

## 6) Other

- **Network tab from URL:** `/network?tab=legacy` opens the Legacy tab (NetworkTabs reads `searchParams.get("tab")`).
- **/build:** Expanded with the same 6 services (bento) and a process diagram (Apply → Align → Build → Ship & Amplify) with links.
