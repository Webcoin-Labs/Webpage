import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarDays, Crown, UsersRound } from "lucide-react";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { ProductsSection } from "@/components/products/ProductsSection";
import { ProblemRevealGrid } from "@/components/home/ProblemRevealGrid";
import { CapabilityRevealGrid } from "@/components/home/CapabilityRevealGrid";
import { StrategyCallForm } from "@/components/forms/StrategyCallForm";
import { prisma } from "@/lib/prisma";
import { getBuilderAffiliation } from "@/lib/affiliation";
import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";

export const metadata: Metadata = {
  title: "Webcoin Labs - Blockchain founder-builder network",
  description:
    "Webcoin Labs connects founders and builders, accelerates product development, and delivers funding readiness with AI-powered analysis and ecosystem access.",
};

const aiFeatures = [
  "Free pitch deck analysis",
  "Project readiness report",
  "Founder profile completeness scoring",
  "Builder-founder matching recommendations",
  "GTM checklist generation",
  "Fundraising readiness analysis",
  "Ecosystem-fit recommendations",
  "Future: investor memo + launch checklist generation",
];

const testimonials = [
  {
    title: "Founder workspace",
    quote: "Live profile, project, intro, and hiring flows in one shared operating layer.",
  },
  {
    title: "Builder workflow",
    quote: "Real jobs, founder hiring inboxes, and recommendation feeds with profile-based matching.",
  },
  {
    title: "AI readiness engine",
    quote: "Deck uploads, extraction, analysis, moderation, and retry logic are production routes.",
  },
  {
    title: "Network execution",
    quote: "Events, partner access, and KOL/VC intro operations are integrated with admin controls.",
  },
];

const services = [
  "Product strategy",
  "MVP build support",
  "Fundraising readiness",
  "KOL marketing",
  "Community growth",
  "Launchpad support",
  "Exchange access",
  "Ecosystem introductions",
  "Technical advisory",
];

const partnerWordmark = [
  "VC Networks",
  "Launchpads",
  "Exchanges",
  "Ecosystem Teams",
  "Founder Circles",
  "Builder Guilds",
];

const binaryLines = Array.from({ length: 10 }, (_, i) =>
  i % 2 === 0
    ? "01010100110101010101010101010101010101010101"
    : "01001010101010101010101010101010101010101010"
);

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
  return prisma.partner.findMany({
    where: { featured: true, status: "CURRENT" },
    orderBy: { sortOrder: "asc" },
    take: 24,
  });
}

async function getFeaturedBuilders() {
  return prisma.builderProfile.findMany({
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
    prisma.founderProfile.count(),
    prisma.builderProfile.count({ where: { publicVisible: true } }),
    prisma.project.count({ where: { publicVisible: true } }),
    prisma.introRequest.count(),
    prisma.aIReport.count(),
    prisma.partner.count({ where: { status: "CURRENT" } }),
    prisma.jobPost.count({ where: { status: "OPEN" } }),
    prisma.founderProfile.count({ where: { isHiring: true } }),
    prisma.event.count({ where: { isPublished: true } }),
    prisma.introRequest.count({ where: { type: "KOL" } }),
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

  const heroPanels = [
    { label: "Founder Profiles", status: `${networkCounts.founderProfiles} live` },
    { label: "Builder Profiles", status: `${networkCounts.builderProfiles} live` },
    { label: "Public Projects", status: `${networkCounts.projects} indexed` },
    { label: "Intro Requests", status: `${networkCounts.introRequests} processed` },
    { label: "AI Reports", status: `${networkCounts.aiReports} generated` },
    { label: "Current Partners", status: `${networkCounts.currentPartners} active` },
  ];

  return (
    <div className="flex flex-col bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 pointer-events-none">
          <div className="binary-layer">
            {binaryLines.map((line, index) => (
              <div key={`binary-${index}`} className="binary-row">
                {line}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-blue-500/20 blur-[140px] animate-float" />
        <div className="absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-[120px] animate-float" />

        <div className="container mx-auto px-6 max-w-7xl relative z-10 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
            <AnimatedSection>
              <div className="inline-flex items-center px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-medium tracking-wide text-blue-300">
                Webcoin Labs
              </div>
              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mt-6 leading-[1.05]">
                <span className="block text-foreground">Where blockchain founders and builders</span>
                <span className="block text-blue-300">turn ideas into launch-ready companies.</span>
              </h1>
              <p className="text-lg text-muted-foreground mt-6 max-w-2xl">
                Create founder and builder profiles, connect with the right people, build products, and get
                AI pitch-deck analysis to become funding-ready with marketing and ecosystem support.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/app"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-500 text-white px-6 py-3 text-sm font-medium transition hover:bg-blue-500/90"
                >
                  Join the Network <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-accent transition"
                >
                  Book a Call
                </Link>
                <Link
                  href="/pitchdeck"
                  className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200"
                >
                  Upload Pitch Deck for Free AI Review
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <div className="rounded-3xl border border-border bg-card/80 backdrop-blur p-8 shadow-soft">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
                      Network panel
                    </p>
                    <h3 className="text-xl font-semibold text-foreground mt-2">Platform activity</h3>
                  </div>
                  <span className="text-xs font-medium px-3 py-1 rounded-full border border-emerald-400/40 text-emerald-300">
                    Live
                  </span>
                </div>
                <div className="mt-8 space-y-4">
                  {heroPanels.map((panel) => (
                    <div key={panel.label} className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">{panel.label}</div>
                      <span className="text-xs px-2.5 py-1 rounded-full border border-border/60 text-foreground">
                        {panel.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 border-t border-border pt-6 text-xs text-muted-foreground">
                  Live metrics from production data sources.
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/10 border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="binary-layer">
            {binaryLines.map((line, index) => (
              <div key={`binary-partner-${index}`} className="binary-row">
                {line}
              </div>
            ))}
          </div>
        </div>
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <AnimatedSection className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Partner network
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mt-4">
              Ecosystem access that compounds distribution.
            </h2>
            <p className="text-lg text-muted-foreground mt-6">
              Webcoin Labs connects founders and builders with VCs, launchpads, exchanges, and community partners.
            </p>
          </AnimatedSection>
          <div className="mt-12 relative overflow-hidden">
            <div className="flex gap-12 w-max partner-marquee-track items-center opacity-50">
              {featuredCurrentPartners.length > 0
                ? [...featuredCurrentPartners, ...featuredCurrentPartners].map((partner, index) => (
                    <div key={`${partner.id}-${index}`} className="flex items-center justify-center">
                      {partner.logoPath ? (
                        <img
                          src={partner.logoPath}
                          alt={partner.name}
                          className="max-h-8 w-auto object-contain grayscale"
                        />
                      ) : (
                        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          {partner.name}
                        </span>
                      )}
                    </div>
                  ))
                : [...partnerWordmark, ...partnerWordmark].map((name, index) => (
                    <div
                      key={`${name}-${index}`}
                      className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                    >
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

      <section className="py-24 border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="binary-layer">
            {binaryLines.map((line, index) => (
              <div key={`binary-ai-${index}`} className="binary-row">
                {line}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-10 right-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-[140px] animate-float" />

        <div className="container mx-auto px-6 max-w-7xl relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <AnimatedSection>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-emerald-300">
              AI-powered founder workflow
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mt-4">
              Practical AI that removes manual founder work.
            </h2>
            <p className="text-lg text-muted-foreground mt-6">
              Webcoin Labs uses AI to deliver clarity, readiness checks, and matching recommendations.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
              {aiFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className="rounded-3xl border border-border bg-black text-emerald-200 p-8 shadow-soft font-mono">
              <div className="flex items-center justify-between text-xs text-emerald-200/70">
                <span>ai.command.center</span>
                <span>active</span>
              </div>
              <div className="mt-6 text-sm space-y-2">
                <div>&gt; deck_uploaded.pdf</div>
                <div>&gt; analyzing market clarity...</div>
                <div>&gt; checking founder readiness...</div>
                <div>&gt; generating launch summary...</div>
                <div className="text-emerald-300">&gt; report ready</div>
                <div className="flex items-center gap-2 text-emerald-100">
                  <span>&gt;</span>
                  <span className="cursor-blink">_</span>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="py-24 bg-muted/10 border-b border-border">
        <div className="container mx-auto px-6 max-w-7xl grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-12 items-start">
          <AnimatedSection>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Find Builders and Collaborators
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mt-4">
              Find builders and collaborators.
            </h2>
            <p className="text-lg text-muted-foreground mt-6">
              Connect with developers, marketers, designers, and founders building in blockchain.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {["Protocol", "Growth", "Product", "Design", "Security", "Ecosystem"].map((tag) => (
                <span key={tag} className="text-xs font-medium px-3 py-1 rounded-full border border-border text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className="grid grid-cols-1 gap-6">
              {featuredBuilders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
                  No public builders yet. Create your builder profile to appear in discovery.
                </div>
              ) : (
                featuredBuilders.map((builder) => {
                  const affiliation = getBuilderAffiliation(builder);
                  const name = builder.user.name ?? "Builder";
                  const role = builder.title ?? builder.headline ?? "Builder";
                  const chain = builder.preferredChains.join(", ") || "Multi-chain";
                  const openTo = builder.openTo.join(", ") || "Collaboration";
                  return (
                    <div key={builder.id} className="rounded-2xl border border-border bg-card p-6">
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
                          <div className="mt-2 text-xs text-muted-foreground">Blockchain expertise: {chain}</div>
                          <div className="mt-2 text-xs text-emerald-300">Open to: {openTo}</div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Link
                            href="/app/hiring"
                            className="rounded-full bg-blue-500 px-4 py-2 text-center text-xs font-medium text-white transition hover:bg-blue-500/90"
                          >
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
              )}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="py-24 border-b border-border">
        <div className="container mx-auto px-6 max-w-7xl grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          <AnimatedSection>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-300">
              Blockchain finance thesis
            </p>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight mt-4">
              Stablecoin rails are changing how projects move money.
            </h2>
            <p className="text-lg text-muted-foreground mt-6 max-w-2xl">
              Faster global movement of value, lower transaction costs, programmable settlement, and better treasury workflows are opening new opportunities for founders.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
              <div className="text-sm font-medium text-emerald-300">Move value globally</div>
              <div className="text-sm font-medium text-emerald-300 mt-2">Lower settlement costs</div>
              <div className="text-sm font-medium text-emerald-300 mt-2">Programmable treasury rails</div>
              <div className="text-sm font-medium text-emerald-300 mt-2">Launch-ready finance stacks</div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="py-24 border-b border-border">
        <div className="container mx-auto px-6 max-w-7xl">
          <AnimatedSection className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-300">
              What founders and builders say
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mt-4">
              What founders and builders say
            </h2>
          </AnimatedSection>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial) => (
              <AnimatedSection key={testimonial.title}>
                <div className="rounded-2xl border border-border bg-card p-6 h-full">
                  <div className="text-sm font-semibold text-foreground">{testimonial.title}</div>
                  <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                    {testimonial.quote}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/10 border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="binary-layer">
            {binaryLines.map((line, index) => (
              <div key={`binary-services-${index}`} className="binary-row">
                {line}
              </div>
            ))}
          </div>
        </div>
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <AnimatedSection className="max-w-3xl">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-emerald-300">
              Services
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mt-4">
              Terminal-grade execution
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="mt-10 rounded-3xl border border-border bg-black text-emerald-200 p-8 shadow-soft font-mono">
              <div className="flex items-center justify-between text-xs text-emerald-200/70">
                <span>webcoin.services</span>
                <span>active</span>
              </div>
              <div className="mt-6 text-sm">
                <div className="text-emerald-200">$ webcoin services</div>
                <div className="mt-4 space-y-2">
                  {services.map((service) => (
                    <div key={service} className="text-emerald-100">
                      &gt; {service}
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-emerald-100">
                    <span>&gt;</span>
                    <span className="cursor-blink">_</span>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="py-20 border-b border-border">
        <div className="container mx-auto px-6 max-w-7xl">
          <AnimatedSection>
            <div className="rounded-2xl border border-border bg-card p-8">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">Inside the app</p>
              <h3 className="mt-3 text-2xl font-semibold">Live platform modules</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                The production app includes hiring, jobs, events, intro operations, and a dedicated KOL premium workspace.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
                <Link href="/app/jobs" className="rounded-xl border border-border/60 bg-background p-4 hover:bg-accent/40">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <BriefcaseBusiness className="h-4 w-4 text-cyan-300" />
                    Jobs
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{networkCounts.openJobs} open roles</p>
                </Link>
                <Link href="/app/hiring" className="rounded-xl border border-border/60 bg-background p-4 hover:bg-accent/40">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <UsersRound className="h-4 w-4 text-emerald-300" />
                    Hiring
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{networkCounts.hiringFounders} founders hiring</p>
                </Link>
                <Link href="/app/events" className="rounded-xl border border-border/60 bg-background p-4 hover:bg-accent/40">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CalendarDays className="h-4 w-4 text-blue-300" />
                    Events
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{networkCounts.publishedEvents} published events</p>
                </Link>
                <Link href="/app/kols-premium" className="rounded-xl border border-border/60 bg-background p-4 hover:bg-accent/40">
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

      <section className="py-24 border-b border-border">
        <div className="container mx-auto px-6 max-w-6xl">
          <AnimatedSection className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-300">Book a strategy call</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mt-4">Book a strategy call</h2>
            <p className="text-lg text-muted-foreground mt-4">
              Share your project and we will map the right path for funding, product, and distribution.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <StrategyCallForm />
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
