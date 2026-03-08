import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, User, CreditCard, Gamepad2, LayoutDashboard, ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/common/AnimatedSection";

export const metadata: Metadata = {
  title: "Products — Webcoin Labs",
  description:
    "Infrastructure products built to help founders launch, grow, and scale blockchain projects. Founder Profile, ArcPay, RiddlePay, Kreatorboard.",
};

const products = [
  {
    icon: User,
    label: "Network Infrastructure",
    badge: "Core Platform",
    title: "Founder Profile",
    desc: "The identity layer of Webcoin Labs. Create verified profiles, showcase projects, connect with collaborators, and unlock ecosystem opportunities.",
    href: "/products/founder-profile",
    cta: "Create Profile",
    ctaHref: "/app",
  },
  {
    icon: CreditCard,
    label: "Payments Infrastructure",
    title: "ArcPay",
    desc: "Payment gateway and merchant infrastructure built on Arc. Blockchain-native payments, checkout flows, and programmable settlement.",
    href: "/products/arcpay",
    cta: "Launch Website",
    ctaExternal: "https://arcpay.io",
  },
  {
    icon: Gamepad2,
    label: "Engagement Infrastructure",
    title: "RiddlePay",
    desc: "Gamified engagement and rewards platform for blockchain communities and products.",
    href: "/products/riddlepay",
    cta: "Launch Website",
    ctaExternal: "https://riddlepay.io",
  },
  {
    icon: LayoutDashboard,
    label: "Creator Infrastructure",
    badge: "Coming Soon",
    title: "Kreatorboard",
    desc: "Creator and KOL operations dashboard (in development). Manage influencer campaigns, track performance, and organize growth workflows.",
    href: "/products/kreatorboard",
    cta: "Notify Me",
    ctaHref: "/contact",
  },
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <AnimatedSection className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Products Built by Webcoin Labs
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Infrastructure products built to help founders launch, grow, and scale blockchain projects.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {products.map((p, i) => {
            const Icon = p.icon;
            return (
              <AnimatedSection key={p.title} delay={i * 0.05}>
                <div className="h-full p-6 rounded-2xl border border-border/50 bg-card/80 hover:border-cyan-500/20 hover:shadow-soft transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    {p.badge && (
                      <span className="px-2.5 py-1 rounded-md border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 text-xs font-medium">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                    {p.label}
                  </p>
                  <h2 className="text-xl font-bold text-foreground mb-2">{p.title}</h2>
                  <p className="text-sm text-muted-foreground mb-6">{p.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={p.href}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      Read More <ArrowRight className="w-4 h-4" />
                    </Link>
                    {p.ctaExternal ? (
                      <a
                        href={p.ctaExternal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-colors"
                      >
                        {p.cta}
                      </a>
                    ) : (
                      <Link
                        href={p.ctaHref!}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-500/90 transition-colors"
                      >
                        {p.cta}
                      </Link>
                    )}
                  </div>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </div>
  );
}
