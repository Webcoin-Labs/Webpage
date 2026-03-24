import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Crown,
  Database,
  FileText,
  LineChart,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { ProductsSection } from "@/components/products/ProductsSection";
import { ProblemRevealGrid } from "@/components/home/ProblemRevealGrid";
import { CapabilityRevealGrid } from "@/components/home/CapabilityRevealGrid";
import { HeroDashboardPreview } from "@/components/home/HeroDashboardPreview";
import { StrategyCallForm } from "@/components/forms/StrategyCallForm";
import { db } from "@/server/db/client";
import { getBuilderAffiliation } from "@/lib/affiliation";
import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";

export const metadata: Metadata = {
  title: "Webcoin Labs - Builder-first venture infrastructure",
  description:
    "Webcoin Labs helps founders launch faster through a unified network for builders, AI readiness, distribution, and ecosystem execution.",
};

const partnerWordmark = [
  "VC Networks",
  "Launchpads",
  "Exchanges",
  "Ecosystem Teams",
  "Founder Circles",
  "Builder Guilds",
];

const demoBuilders = [
  { name: "Alex Chen", role: "Protocol Engineer", chain: "Base, Arc", openTo: "Full-time, Advisory", affiliationLabel: "Independent", affiliationVariant: "independent" as const },
  { name: "Jordan Lee", role: "Growth Lead", chain: "EVM, Solana", openTo: "Contract, Cofounder", affiliationLabel: "ARC Builder", affiliationVariant: "default" as const },
  { name: "Sam Rivera", role: "Smart Contract Dev", chain: "Arc, Base", openTo: "Full-time, Part-time", affiliationLabel: "Available", affiliationVariant: "available" as const },
];

const aiOperatingCards = [
  {
    title: "Pitch deck extraction and scoring",
    detail: "Built into live workflows with moderation, retries, and production-safe processing.",
    icon: FileText,
  },
  {
    title: "Fundraising readiness diagnosis",
    detail: "Signal clarity, positioning quality, and investor-readiness risks before outreach.",
    icon: LineChart,
  },
  {
    title: "Builder-founder match recommendations",
    detail: "Ranked matching suggestions based on profile depth, chain focus, and intent.",
    icon: UsersRound,
  },
  {
    title: "Go-to-market action plan generation",
    detail: "Actionable execution plans for launch sequencing, positioning, and growth priorities.",
    icon: Target,
  },
  {
    title: "Founder and builder identity layer",
    detail: "Structured identity across skills, projects, and credibility signals.",
    icon: ShieldCheck,
  },
  {
    title: "Open jobs, hiring requests, and intros",
    detail: "Operational routing for hiring and warm network introductions in one layer.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Moderated uploads and storage operations",
    detail: "Secure asset ingestion, moderation logs, and reliable storage controls.",
    icon: Database,
  },
  {
    title: "Event operations and reminder workflows",
    detail: "Published events, RSVP orchestration, and reminder delivery automation.",
    icon: CalendarDays,
  },
];

type NetworkCounts = {
  founderProfiles: number;
  builderProfiles: number;
  projects: number;
  introRequests: number;
  aiReports: number;
  currentPartners: number;
  openJobs: number;
  hiringFounders: number;
  publishedEvents: number;
  kolRequests: number;
};

async function getFeaturedCurrentPartners() {
  return db.partner.findMany({
    where: { featured: true, status: "CURRENT" },
    orderBy: { sortOrder: "asc" },
    take: 24,
  });
}

async function getFeaturedBuilders() {
  return db.builderProfile.findMany({
    where: { publicVisible: true },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { updatedAt: "desc" },
    take: 3,
  });
}

async function getNetworkCounts(): Promise<NetworkCounts> {
  const [
    founderProfiles,
    builderProfiles,
    projects,
    introRequests,
    aiReports,
    currentPartners,
    openJobs,
    hiringFounders,
    publishedEvents,
    kolRequests,
  ] = await Promise.all([
    db.founderProfile.count(),
    db.builderProfile.count({ where: { publicVisible: true } }),
    db.project.count({ where: { publicVisible: true } }),
    db.introRequest.count(),
    db.aIReport.count(),
    db.partner.count({ where: { status: "CURRENT" } }),
    db.jobPost.count({ where: { status: "OPEN" } }),
    db.founderProfile.count({ where: { isHiring: true } }),
    db.event.count({ where: { isPublished: true } }),
    db.introRequest.count({ where: { type: "KOL" } }),
  ]);

  return {
    founderProfiles,
    builderProfiles,
    projects,
    introRequests,
    aiReports,
    currentPartners,
    openJobs,
    hiringFounders,
    publishedEvents,
    kolRequests,
  };
}

export default async function HomePage() {
  let featuredCurrentPartners: Awaited<ReturnType<typeof getFeaturedCurrentPartners>> = [];
  let featuredBuilders: Awaited<ReturnType<typeof getFeaturedBuilders>> = [];
  let networkCounts: NetworkCounts = {
    founderProfiles: 0,
    builderProfiles: 0,
    projects: 0,
    introRequests: 0,
    aiReports: 0,
    currentPartners: 0,
    openJobs: 0,
    hiringFounders: 0,
    publishedEvents: 0,
    kolRequests: 0,
  };

  try {
    [featuredCurrentPartners, featuredBuilders, networkCounts] = await Promise.all([
      getFeaturedCurrentPartners(),
      getFeaturedBuilders(),
      getNetworkCounts(),
    ]);
  } catch (_e) {
    // DB optional
  }

  return (
    <div className="flex flex-col bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_18%_0%,rgba(44,114,255,0.35),transparent_52%),radial-gradient(900px_520px_at_90%_100%,rgba(56,189,248,0.14),transparent_58%)]" />
          <div className="absolute -left-[12%] -top-[26%] h-[720px] w-[720px] rounded-full border border-blue-300/15" />
          <div className="absolute left-[22%] -top-[30%] h-[980px] w-[980px] rounded-full border border-blue-200/10" />
          <div className="absolute -right-[22%] top-[14%] h-[780px] w-[780px] rounded-full border border-cyan-200/10" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,8,23,0.04),rgba(2,8,23,0.7))]" />
        </div>

        <div className="container relative z-10 mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-[1.18fr_0.82fr]">
            <AnimatedSection>
              <p className="inline-flex items-center rounded-full border border-blue-300/25 bg-blue-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-blue-100">
                Builder-first venture infrastructure
              </p>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.03] tracking-tight md:text-6xl">
                Build real blockchain companies with the right builders, systems, and distribution.
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
                Webcoin Labs gives founders and builders one operating layer to collaborate, ship faster, and get
                fundraising-ready through structured profiles, matching, intros, and ecosystem distribution.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                {[
                  { label: "Influencers", value: "1,500+" },
                  { label: "Founders", value: "100+" },
                  { label: "Builders", value: "50+" },
                ].map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/40 px-3 py-1 text-muted-foreground"
                  >
                    <span className="font-semibold text-foreground">{item.value}</span>
                    <span>{item.label}</span>
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/app"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
                >
                  Launch App <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/30 px-6 py-3 text-sm font-medium text-foreground transition hover:bg-accent/70"
                >
                  Talk to Sales
                </Link>
                <Link href="/pitchdeck" className="inline-flex items-center gap-2 px-1 py-3 text-sm text-blue-200 hover:text-blue-100">
                  Get free AI pitch analysis
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.08} className="justify-self-center lg:justify-self-end w-full max-w-[560px] lg:max-w-none">
              <HeroDashboardPreview />
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted/10 py-20">
        <div className="container mx-auto max-w-7xl px-6">
          <AnimatedSection className="mx-auto max-w-3xl text-center">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Ecosystem access</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
              Trusted by founder communities, ecosystems, and distribution partners.
            </h2>
          </AnimatedSection>
          <div className="relative mt-10 overflow-hidden">
            <div className="partner-marquee-track flex w-max items-center gap-12 opacity-60">
              {featuredCurrentPartners.length > 0
                ? [...featuredCurrentPartners, ...featuredCurrentPartners].map((partner, index) => (
                    <div key={`${partner.id}-${index}`} className="flex items-center justify-center">
                      {partner.logoPath ? (
                        <img src={partner.logoPath} alt={partner.name} className="max-h-8 w-auto object-contain grayscale" />
                      ) : (
                        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{partner.name}</span>
                      )}
                    </div>
                  ))
                : [...partnerWordmark, ...partnerWordmark].map((name, index) => (
                    <div key={`${name}-${index}`} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {name}
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </section>

      <ProblemRevealGrid />
      <CapabilityRevealGrid />
      <ProductsSection />

      <section className="border-b border-border py-24">
        <div className="container mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2">
          <AnimatedSection>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Operating advantages</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
              Designed for fast-moving founders and high-context builders.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              The best Layer 1, Layer 2, and fintech platforms ship with clarity, trust signals, and operational
              confidence. We apply the same principles to founder execution.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.06}>
            <div className="grid gap-4">
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" /> Credibility-first identity layer
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Structured builder and founder profiles with verified context, social proof, and discoverability.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-blue-300" /> Productive AI, not novelty
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  AI is integrated as a workflow multiplier across deck analysis, matching, and operational planning.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <UsersRound className="h-4 w-4 text-cyan-300" /> Network execution at scale
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Hiring, intros, events, and partner coordination are unified into one production-grade command layer.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="border-b border-border bg-muted/10 py-24">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="rounded-3xl border border-border/70 bg-card p-6 md:p-8">
            <AnimatedSection className="mx-auto max-w-3xl text-center">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">AI operating layer</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Actionable intelligence for founder execution.</h2>
            </AnimatedSection>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {aiOperatingCards.map((item) => {
                const Icon = item.icon;
                return (
                  <AnimatedSection key={item.title}>
                    <div className="flex items-start gap-4 rounded-2xl border border-border/70 bg-background/60 p-5 transition-colors hover:border-border hover:bg-accent/30">
                      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-card">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{item.title}</div>
                        <p className="mt-1.5 text-sm text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border py-24">
        <div className="container mx-auto grid max-w-7xl items-start gap-10 px-6 lg:grid-cols-[0.95fr_1.05fr]">
          <AnimatedSection>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Builder discovery</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Find serious builders faster.</h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Discover builders by role, chain, and collaboration intent. Match execution speed with product ambition.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.08}>
            <div className="grid grid-cols-1 gap-5">
              {featuredBuilders.length > 0
                ? featuredBuilders.map((builder) => {
                    const affiliation = getBuilderAffiliation(builder);
                    const name = builder.user.name ?? "Builder";
                    const role = builder.title ?? builder.headline ?? "Builder";
                    const chain = builder.preferredChains.join(", ") || "Multi-chain";
                    const openTo = builder.openTo.join(", ") || "Collaboration";
                    return (
                      <div key={builder.id} className="rounded-2xl border border-border/70 bg-card p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <ProfileAvatar
                                src={builder.user.image}
                                alt={name}
                                fallback={name.charAt(0)}
                                className="h-8 w-8 rounded-full"
                                fallbackClassName="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-xs text-cyan-200"
                              />
                              <div className="text-sm font-semibold text-foreground">{name}</div>
                              <ProfileAffiliationTag label={affiliation.label} variant={affiliation.variant} />
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">{role}</div>
                            <div className="mt-2 text-xs text-muted-foreground">Chain expertise: {chain}</div>
                            <div className="mt-2 text-xs text-emerald-300">Open to: {openTo}</div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Link href="/app/hiring" className="rounded-full bg-blue-600 px-4 py-2 text-center text-xs font-medium text-white transition hover:bg-blue-500">
                              Connect
                            </Link>
                            <Link
                              href={builder.handle ? `/builders/${builder.handle}` : `/builders/${builder.user.id}`}
                              className="rounded-full border border-border px-4 py-2 text-center text-xs font-medium text-foreground transition hover:bg-accent"
                            >
                              View Profile
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                : demoBuilders.map((builder, idx) => (
                    <div key={`demo-${idx}`} className="rounded-2xl border border-border/70 bg-card p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <ProfileAvatar
                              src={null}
                              alt={builder.name}
                              fallback={builder.name.charAt(0)}
                              className="h-8 w-8 rounded-full"
                              fallbackClassName="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-xs text-cyan-200"
                            />
                            <div className="text-sm font-semibold text-foreground">{builder.name}</div>
                            <ProfileAffiliationTag label={builder.affiliationLabel} variant={builder.affiliationVariant} />
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{builder.role}</div>
                          <div className="mt-2 text-xs text-muted-foreground">Chain expertise: {builder.chain}</div>
                          <div className="mt-2 text-xs text-emerald-300">Open to: {builder.openTo}</div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Link href="/app/hiring" className="rounded-full bg-blue-600 px-4 py-2 text-center text-xs font-medium text-white transition hover:bg-blue-500">
                            Connect
                          </Link>
                          <Link href="/builders" className="rounded-full border border-border px-4 py-2 text-center text-xs font-medium text-foreground transition hover:bg-accent">
                            View Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="border-b border-border py-20">
        <div className="container mx-auto max-w-7xl px-6">
          <AnimatedSection>
            <div className="rounded-2xl border border-border/70 bg-card p-8">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Inside the app</p>
              <h3 className="mt-3 text-2xl font-semibold">Live platform modules</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Production modules for hiring, jobs, events, intros, and KOL workflows.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
                <Link href="/app/jobs" className="rounded-xl border border-border/60 bg-background p-4 transition hover:bg-accent/40">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <BriefcaseBusiness className="h-4 w-4 text-cyan-300" />
                    Jobs
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{networkCounts.openJobs} open roles</p>
                </Link>
                <Link href="/app/hiring" className="rounded-xl border border-border/60 bg-background p-4 transition hover:bg-accent/40">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <UsersRound className="h-4 w-4 text-emerald-300" />
                    Hiring
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{networkCounts.hiringFounders} founders hiring</p>
                </Link>
                <Link href="/app/events" className="rounded-xl border border-border/60 bg-background p-4 transition hover:bg-accent/40">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CalendarDays className="h-4 w-4 text-blue-300" />
                    Events
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{networkCounts.publishedEvents} published events</p>
                </Link>
                <Link href="/app/kols-premium" className="rounded-xl border border-border/60 bg-background p-4 transition hover:bg-accent/40">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Crown className="h-4 w-4 text-amber-300" />
                    KOL Premium
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{networkCounts.kolRequests} KOL requests tracked</p>
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="border-b border-border py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <AnimatedSection className="mx-auto max-w-2xl text-center">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Book a strategy call</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Design your launch roadmap with Webcoin Labs.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Share your current stage, goals, and blockers. We will map a focused path for product, ecosystem, and growth execution.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.08}>
            <StrategyCallForm />
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
