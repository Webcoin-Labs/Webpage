import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Code2, Rocket, Handshake, ChevronRight, User, FileEdit, Globe, MessageSquare, TrendingUp } from "lucide-react";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { prisma } from "@/lib/prisma";
import { PartnerMarquee } from "@/components/partners/PartnerMarquee";
import { HeroSection } from "@/components/hero/HeroSection";
import { ProblemsSection } from "@/components/problems/ProblemsSection";
import { SolutionsSection } from "@/components/solutions/SolutionsSection";
import { ProductsSection } from "@/components/products/ProductsSection";
import { ServicesSection } from "@/components/services/ServicesSection";
import { IndustryFocusSection } from "@/components/industry/IndustryFocusSection";
import { HomepageCTA } from "@/components/cta/HomepageCTA";

export const metadata: Metadata = {
  title: "Webcoin Labs 2.0 — Infrastructure for Blockchain & Stablecoin Startups",
  description:
    "Builder infrastructure platform for blockchain and stablecoin startups. Identity, discovery, ecosystem access, distribution.",
};

const pillars = [
  {
    icon: Code2,
    title: "Identity",
    description:
      "Builder and founder profiles, verified by Webcoin Labs. One place to showcase who you are and what you build.",
    color: "cyan",
  },
  {
    icon: Rocket,
    title: "Discovery",
    description:
      "Public directories for builders and projects. Discover talent and ideas across the network.",
    color: "violet",
  },
  {
    icon: Handshake,
    title: "Access",
    description:
      "Gated applications, intro requests, and programs. Ecosystem support — we match, we don't expose lists.",
    color: "gold",
  },
];

const platformSteps = [
  { icon: User, title: "Create builder identity", desc: "Set up your profile and get verified." },
  { icon: FileEdit, title: "Publish project", desc: "Add your project to the directory." },
  { icon: Globe, title: "Access ecosystem network", desc: "Connect with partners and resources." },
  { icon: MessageSquare, title: "Request introductions", desc: "Apply for intros to VCs and KOLs." },
  { icon: TrendingUp, title: "Grow product and distribution", desc: "Leverage network access for growth." },
];

const insightPosts = [
  {
    tag: "Announcement",
    title: "Introducing Webcoin Labs 2.0",
    excerpt: "We're rebooting. Here's what changed, what stayed, and what we're building next.",
    href: "/webcoin-labs-2-0",
    date: "Feb 2026",
  },
  {
    tag: "Ecosystem",
    title: "Why Base is Our First Ecosystem Track",
    excerpt: "Base's developer momentum and Coinbase infrastructure make it the ideal first track.",
    href: "/insights/why-base",
    date: "Feb 2026",
  },
  {
    tag: "Program",
    title: "Builder Program Structure — Cohort 1",
    excerpt: "8 weeks. Real projects. Ecosystem support. A breakdown of how our first cohort works.",
    href: "/insights/builder-program-cohort-1",
    date: "Mar 2026",
  },
];

async function getFeaturedCurrentPartners() {
  return prisma.partner.findMany({
    where: { featured: true, status: "CURRENT" },
    orderBy: { sortOrder: "asc" },
    take: 24,
  });
}

async function getPortfolioPartners() {
  return prisma.partner.findMany({
    where: { category: "PORTFOLIO" },
    orderBy: { sortOrder: "asc" },
    take: 12,
  });
}

export default async function HomePage() {
  const [featuredCurrentPartners, portfolioPartners] = await Promise.all([
    getFeaturedCurrentPartners(),
    getPortfolioPartners(),
  ]);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <HeroSection />

      {/* Trusted network logos */}
      {featuredCurrentPartners.length > 0 && (
        <PartnerMarquee partners={featuredCurrentPartners} />
      )}

      {/* Industry problems */}
      <ProblemsSection />

      {/* Webcoin Labs solution */}
      <SolutionsSection />

      {/* Three pillars */}
      <section className="py-24 border-y border-border/50 bg-background">
        <div className="container mx-auto px-6">
          <AnimatedSection className="text-center mb-20">
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">What We Do</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              Three pillars. One mission.
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Everything we do is focused on helping builders ship and founders succeed — without hype, without unrealistic promises.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pillars.map((pillar, i) => {
              const Icon = pillar.icon;
              const colorMap: Record<string, string> = {
                cyan: "from-cyan-500/15 to-cyan-500/0 border-cyan-500/30 text-cyan-400",
                violet: "from-violet-500/15 to-violet-500/0 border-violet-500/30 text-violet-400",
                gold: "from-amber-500/15 to-amber-500/0 border-amber-500/30 text-amber-400",
              };
              const colors = colorMap[pillar.color];
              return (
                <AnimatedSection key={pillar.title} delay={i * 0.1}>
                  <div className={`group h-full p-8 rounded-2xl border-2 bg-gradient-to-b ${colors} hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300 cursor-default`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-gradient-to-br ${pillar.color === "cyan" ? "from-cyan-500/25 to-cyan-500/5" : pillar.color === "violet" ? "from-violet-500/25 to-violet-500/5" : "from-amber-500/25 to-amber-500/5"}`}>
                      <Icon className={`w-6 h-6 ${pillar.color === "cyan" ? "text-cyan-400" : pillar.color === "violet" ? "text-violet-400" : "text-amber-400"}`} />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{pillar.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>

          <AnimatedSection className="mt-10 text-center">
            <Link href="/products" className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
              See the full breakdown <ChevronRight className="w-4 h-4" />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Products */}
      <ProductsSection />

      {/* Services */}
      <ServicesSection />

      {/* Industry focus */}
      <IndustryFocusSection />

      {/* Partner network (full section) */}
      <section className="py-20 border-y border-border/50 bg-muted/20">
        <div className="container mx-auto px-6 text-center">
          <AnimatedSection>
            <h2 className="text-2xl font-bold text-foreground mb-2">Explore the ecosystem</h2>
            <p className="text-sm text-muted-foreground mb-6">Discover builders and projects in the network.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/builders" className="px-6 py-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 font-medium text-sm border border-cyan-500/30 transition-all">
                Browse Builders
              </Link>
              <Link href="/projects" className="px-6 py-3 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 font-medium text-sm border border-violet-500/30 transition-all">
                Browse Projects
              </Link>
              <Link href="/network" className="px-6 py-3 rounded-xl border border-border hover:border-cyan-500/40 text-foreground/90 font-medium text-sm transition-all">
                View Network
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Legacy credibility */}
      <section className="py-20 border-y border-border/50 bg-background">
        <div className="container mx-auto px-6 text-center max-w-2xl mx-auto">
          <AnimatedSection>
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3">2021–2023</p>
            <h2 className="text-2xl font-bold text-foreground mb-3">Webcoin Labs Legacy</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Partnership network, launchpad relationships, community growth, KOL network, projects supported. We supported and collaborated — no guaranteed listings or funding.
            </p>
            <Link href="/webcoin-labs-2-0#achievements" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
              Read full story: What we achieved →
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* How the platform works */}
      <section className="py-24 bg-muted/40 border-y border-border/50">
        <div className="container mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">Platform</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">How the platform works</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-5xl mx-auto">
            {platformSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <AnimatedSection key={step.title} delay={i * 0.08} className="relative">
                  <div className="text-center p-6 rounded-xl border border-border/50 bg-card/80 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 hover:scale-[1.02] transition-all duration-300">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="text-2xl font-black text-foreground/90 mb-2 font-mono">{i + 1}</div>
                    <h3 className="text-base font-bold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                  {i < platformSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 text-foreground/40 text-xl">→</div>
                  )}
                </AnimatedSection>
              );
            })}
          </div>
          <AnimatedSection className="mt-12 text-center">
            <Link href="/app/apply" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 font-semibold text-sm border-2 border-violet-500/40 transition-all">
              Apply Now <ArrowRight className="w-4 h-4" />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Insights */}
      <section className="py-24 bg-muted/30 border-y border-border/50">
        <div className="container mx-auto px-6">
          <AnimatedSection className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3">Insights</p>
              <h2 className="text-3xl font-bold text-foreground">Latest from Webcoin Labs</h2>
            </div>
            <Link href="/insights" className="hidden md:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insightPosts.map((post, i) => (
              <AnimatedSection key={post.title} delay={i * 0.1}>
                <Link href={post.href} className="group block h-full">
                  <div className="h-full p-6 rounded-xl border-2 border-border/50 bg-card hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 hover:scale-[1.02] transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent text-muted-foreground">{post.tag}</span>
                      <span className="text-xs text-muted-foreground">{post.date}</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 group-hover:text-cyan-400 transition-colors">{post.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <HomepageCTA />
    </div>
  );
}
