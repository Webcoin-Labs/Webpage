import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, User, CreditCard, Gamepad2, LayoutDashboard, ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/common/AnimatedSection";

export const metadata: Metadata = {
  title: "Products - Webcoin Labs",
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
    badge: "Live Beta",
    title: "Kreatorboard",
    desc: "Creator and KOL operations dashboard for campaign management, performance tracking, and structured growth workflows.",
    href: "/products/kreatorboard",
    cta: "Open KOL Premium",
    ctaHref: "/app/kols-premium",
  },
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen pb-20 pt-24">
      <div className="container mx-auto max-w-5xl px-6">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <AnimatedSection className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Products Built by Webcoin Labs
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Infrastructure products built to help founders launch, grow, and scale blockchain projects.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {products.map((p, i) => {
            const Icon = p.icon;
            return (
              <AnimatedSection key={p.title} delay={i * 0.05}>
                <div className="h-full rounded-2xl border border-border/50 bg-card/80 p-6 transition-all hover:border-cyan-500/20 hover:shadow-soft">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    {p.badge && (
                      <span className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-400">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{p.label}</p>
                  <h2 className="mb-2 text-xl font-bold text-foreground">{p.title}</h2>
                  <p className="mb-6 text-sm text-muted-foreground">{p.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={p.href}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      Read More <ArrowRight className="h-4 w-4" />
                    </Link>
                    {p.ctaExternal ? (
                      <a
                        href={p.ctaExternal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20"
                      >
                        {p.cta}
                      </a>
                    ) : (
                      <Link
                        href={p.ctaHref!}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500/90"
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
