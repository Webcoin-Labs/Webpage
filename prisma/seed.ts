import { PrismaClient, PartnerCategory, PartnerStatus, EventType, EventTrack, EventFormat } from "@prisma/client";

const prisma = new PrismaClient();

// Named partners (order matches copied files vc-1..16, launchpad-1..16)
const VC_NAMES = [
  "Animoca Brands",
  "Morningstar Ventures",
  "3Commas Capital",
  "Lotus Capital",
  "Pluto Digital",
  "Magnus Capital",
  "Skynet Trading",
  "NGC Ventures",
  "VC Partner 9",
  "VC Partner 10",
  "VC Partner 11",
  "VC Partner 12",
  "VC Partner 13",
  "VC Partner 14",
  "VC Partner 15",
  "VC Partner 16",
];

const LAUNCHPAD_NAMES = [
  "DAO Maker",
  "GameFi",
  "Seedify",
  "RedKite",
  "Polkastarter",
  "TrustPad",
  "BSCStation",
  "Paid Ignition",
  "Launchpad Partner 9",
  "Launchpad Partner 10",
  "Launchpad Partner 11",
  "Launchpad Partner 12",
  "Launchpad Partner 13",
  "Launchpad Partner 14",
  "Launchpad Partner 15",
  "Launchpad Partner 16",
];

async function main() {
  console.log("🌱 Seeding Webcoin Labs 2.0 database...");

  const partners: Array<{
    slug: string;
    name: string;
    category: PartnerCategory;
    status: PartnerStatus;
    featured: boolean;
    logoPath: string | null;
    url: string | null;
    sortOrder: number;
  }> = [];

  let sortOrder = 1;
  // Asset compatibility note:
  // The repo currently includes only a small set of partner logo assets under /public/network/current.
  // To keep seed data production-safe (no broken images), we point seeded logoPath values to assets that exist.
  const CURRENT_LOGO = "/network/current/animoca-brands.svg";
  const ALT_CURRENT_LOGO = "/network/current/base.svg";
  const LEGACY_LOGO = "/network/current/polygon.svg";

  // --- CURRENT + FEATURED: 8 VC (current/vc/vc-1..8)
  for (let i = 0; i < 8; i++) {
    const name = VC_NAMES[i]!;
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    partners.push({
      slug: `vc-current-${i + 1}`,
      name,
      category: PartnerCategory.VC,
      status: PartnerStatus.CURRENT,
      featured: true,
      logoPath: CURRENT_LOGO,
      url: null,
      sortOrder: sortOrder++,
    });
  }

  // --- LEGACY: 8 more VC (legacy/vc/vc-9..16)
  for (let i = 8; i < 16; i++) {
    const name = VC_NAMES[i]!;
    partners.push({
      slug: `vc-legacy-${i + 1}`,
      name,
      category: PartnerCategory.VC,
      status: PartnerStatus.LEGACY,
      featured: false,
      logoPath: LEGACY_LOGO,
      url: null,
      sortOrder: sortOrder++,
    });
  }

  // --- CURRENT + FEATURED: 8 Launchpads (current/launchpads/launchpad-1..8)
  for (let i = 0; i < 8; i++) {
    const name = LAUNCHPAD_NAMES[i]!;
    partners.push({
      slug: `launchpad-current-${i + 1}`,
      name,
      category: PartnerCategory.LAUNCHPAD,
      status: PartnerStatus.CURRENT,
      featured: true,
      logoPath: ALT_CURRENT_LOGO,
      url: null,
      sortOrder: sortOrder++,
    });
  }

  // --- LEGACY: 8 more Launchpads (legacy/launchpads/launchpad-9..16)
  for (let i = 8; i < 16; i++) {
    const name = LAUNCHPAD_NAMES[i]!;
    partners.push({
      slug: `launchpad-legacy-${i + 1}`,
      name,
      category: PartnerCategory.LAUNCHPAD,
      status: PartnerStatus.LEGACY,
      featured: false,
      logoPath: LEGACY_LOGO,
      url: null,
      sortOrder: sortOrder++,
    });
  }

  // --- CEX: CURRENT featured (placeholders / no logo or reuse)
  const cexPartners = [
    { name: "KuCoin", url: "https://kucoin.com" },
    { name: "Gate.io", url: "https://gate.io" },
    { name: "MEXC", url: "https://mexc.com" },
    { name: "Bybit", url: "https://bybit.com" },
  ];
  cexPartners.forEach((c, i) => {
    const slug = c.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    partners.push({
      slug: `cex-${slug}`,
      name: c.name,
      category: PartnerCategory.CEX,
      status: i < 2 ? PartnerStatus.CURRENT : PartnerStatus.LEGACY,
      featured: i < 2,
      logoPath: null, // optional: add /network/current/cex/cex-1.svg etc. later
      url: c.url ?? null,
      sortOrder: sortOrder++,
    });
  });

  // --- Portfolio (legacy logos copied)
  const portfolioEntries = [
    { name: "Bitbrawl", logoPath: LEGACY_LOGO },
    { name: "Corite", logoPath: LEGACY_LOGO },
    { name: "Dropp", logoPath: LEGACY_LOGO },
    { name: "KPC", logoPath: LEGACY_LOGO },
    { name: "Altava Group", logoPath: LEGACY_LOGO },
  ];
  portfolioEntries.forEach((p, i) => {
    const slug = p.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    partners.push({
      slug: `portfolio-${slug}`,
      name: p.name,
      category: PartnerCategory.PORTFOLIO,
      status: PartnerStatus.LEGACY,
      featured: i < 2,
      logoPath: p.logoPath,
      url: null,
      sortOrder: sortOrder++,
    });
  });

  // --- Media / Guild (no logos from _legacy; optional placeholders)
  partners.push(
    { slug: "crypto-banter", name: "Crypto Banter", category: PartnerCategory.MEDIA, status: PartnerStatus.CURRENT, featured: true, logoPath: ALT_CURRENT_LOGO, url: null, sortOrder: sortOrder++ },
    { slug: "yield-guild-games", name: "Yield Guild Games", category: PartnerCategory.GUILD, status: PartnerStatus.CURRENT, featured: true, logoPath: CURRENT_LOGO, url: null, sortOrder: sortOrder++ },
  );

  for (const p of partners) {
    await prisma.partner.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        category: p.category,
        status: p.status,
        featured: p.featured,
        sortOrder: p.sortOrder,
        url: p.url ?? undefined,
        logoPath: p.logoPath ?? undefined,
      },
      create: {
        slug: p.slug,
        name: p.name,
        category: p.category,
        status: p.status,
        featured: p.featured ?? false,
        url: p.url ?? null,
        logoPath: p.logoPath ?? null,
        sortOrder: p.sortOrder,
      },
    });
  }

  const total = partners.length;
  const currentCount = partners.filter((p) => p.status === PartnerStatus.CURRENT).length;
  const legacyCount = partners.filter((p) => p.status === PartnerStatus.LEGACY).length;
  const featuredCount = partners.filter((p) => p.featured).length;

  console.log(`✅ Seeded ${total} total partners`);
  console.log(`   - ${currentCount} CURRENT (${featuredCount} featured)`);
  console.log(`   - ${legacyCount} LEGACY`);

  // --- Events (YC-style: office hours, workshops, founder talks, demo day)
  const now = new Date();
  const nextWeek = (d: Date, days: number) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
  const events = [
    { slug: "office-hours-stablecoin-1", title: "Office Hours: Stablecoin Infrastructure", summary: "1:1 slots for stablecoin builders.", type: EventType.OFFICE_HOURS, track: EventTrack.STABLECOINS, format: EventFormat.ONLINE, startAt: nextWeek(now, 2), endAt: nextWeek(now, 2), isPublished: true, isFeatured: false },
    { slug: "office-hours-general", title: "Office Hours: General", summary: "Open office hours for Webcoin Labs builders.", type: EventType.OFFICE_HOURS, track: null, format: EventFormat.ONLINE, startAt: nextWeek(now, 5), endAt: nextWeek(now, 5), isPublished: true, isFeatured: false },
    { slug: "workshop-stablecoin-compliance", title: "Stablecoin Compliance & Legal", summary: "Workshop on compliance and legal considerations for stablecoin products.", type: EventType.WORKSHOP, track: EventTrack.LEGAL_COMPLIANCE, format: EventFormat.ONLINE, startAt: nextWeek(now, 7), endAt: nextWeek(now, 7), isPublished: true, isFeatured: true },
    { slug: "workshop-fintech-gtm", title: "Fintech GTM & Distribution", summary: "Go-to-market and distribution strategies for fintech builders.", type: EventType.WORKSHOP, track: EventTrack.GTM_DISTRIBUTION, format: EventFormat.ONLINE, startAt: nextWeek(now, 10), endAt: nextWeek(now, 10), isPublished: true, isFeatured: false },
    { slug: "founder-talk-pmf", title: "Founder Talk: Finding PMF in Web3", summary: "A conversation with founders on product-market fit.", type: EventType.FOUNDER_TALK, track: EventTrack.FINTECH, format: EventFormat.ONLINE, startAt: nextWeek(now, 4), endAt: nextWeek(now, 4), isPublished: true, isFeatured: false },
    { slug: "founder-talk-infra", title: "Founder Talk: Infrastructure Builders", summary: "Building infrastructure for the next wave of apps.", type: EventType.FOUNDER_TALK, track: EventTrack.INFRA, format: EventFormat.HYBRID, startAt: nextWeek(now, 12), endAt: nextWeek(now, 12), isPublished: true, isFeatured: false },
    { slug: "partner-session-vc", title: "Partner Session: VC Introductions", summary: "Session with partner VCs for qualified founders.", type: EventType.PARTNER_SESSION, track: null, format: EventFormat.ONLINE, startAt: nextWeek(now, 14), endAt: nextWeek(now, 14), isPublished: true, isFeatured: false },
    { slug: "community-meetup-1", title: "Community Meetup: Stablecoins & Fintech", summary: "Monthly community catch-up for stablecoin and fintech builders.", type: EventType.COMMUNITY_MEETUP, track: EventTrack.STABLECOINS, format: EventFormat.ONLINE, startAt: nextWeek(now, 21), endAt: nextWeek(now, 21), isPublished: true, isFeatured: false },
    { slug: "demo-day-q1", title: "Demo Day Q1 Showcase", summary: "Selected startups present to investors and partners.", type: EventType.DEMO_DAY, track: null, format: EventFormat.ONLINE, startAt: nextWeek(now, 28), endAt: nextWeek(now, 28), isPublished: true, isFeatured: true },
    { slug: "draft-event-unpublished", title: "Draft Event (Unpublished)", summary: "This event is not published.", type: EventType.AMA, track: EventTrack.SECURITY, format: EventFormat.ONLINE, startAt: nextWeek(now, 30), endAt: nextWeek(now, 30), isPublished: false, isFeatured: false },
  ];

  for (const e of events) {
    const endAt = new Date(e.startAt.getTime() + 60 * 60 * 1000);
    await prisma.event.upsert({
      where: { slug: e.slug },
      update: {
        title: e.title,
        summary: e.summary,
        type: e.type,
        track: e.track,
        format: e.format,
        startAt: e.startAt,
        endAt,
        isPublished: e.isPublished,
        isFeatured: e.isFeatured,
      },
      create: {
        slug: e.slug,
        title: e.title,
        summary: e.summary,
        type: e.type,
        track: e.track,
        format: e.format,
        startAt: e.startAt,
        endAt,
        isPublished: e.isPublished,
        isFeatured: e.isFeatured,
      },
    });
  }
  console.log(`✅ Seeded ${events.length} events`);

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
