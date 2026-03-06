import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Briefcase, FileCheck, Globe, Megaphone, Rocket, Users, Target, Code2 } from "lucide-react";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { ServicesPageCTA } from "@/components/services/ServicesPageCTA";

export const metadata: Metadata = {
  title: "Services — Webcoin Labs",
  description: "Venture studio support, capital readiness, ecosystem partnerships, community distribution. Services provided by Webcoin Labs.",
};

const services = [
  { icon: Briefcase, title: "Venture Studio Support", desc: "Product, GTM, and distribution support for portfolio teams.", href: "/app/apply/founder-support" },
  { icon: FileCheck, title: "Capital Readiness", desc: "Pitch, narrative, investor prep. No funding guarantees — we prepare you.", href: "/app/apply/founder-support" },
  { icon: Globe, title: "Ecosystem Partnerships", desc: "Introductions to partners, infra, and protocols.", href: "/network" },
  { icon: Megaphone, title: "Community Distribution", desc: "Ethical marketing and community activation through the network.", href: "/app/intros/new" },
  { icon: Rocket, title: "Token Launch Support", desc: "Launchpad and distribution support. No guaranteed listings.", href: "/build" },
  { icon: Users, title: "Talent Matching", desc: "Builders ↔ founders. Intros and matching through the platform.", href: "/builders" },
  { icon: Target, title: "Product Strategy", desc: "Product-market fit, roadmap, and go-to-market advisory.", href: "/build" },
  { icon: Code2, title: "Developer Ecosystem Growth", desc: "Builder cohorts and developer programs.", href: "/app/apply/builder-program" },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <AnimatedSection className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Services
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Venture studio support, capital readiness, ecosystem access. Historically and now.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <AnimatedSection key={s.title} delay={i * 0.06}>
                <Link
                  href={s.href}
                  className="block p-6 rounded-2xl border border-border/50 bg-card hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/5 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">{s.title}</h2>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </Link>
              </AnimatedSection>
            );
          })}
        </div>
      </div>

      <ServicesPageCTA />
    </div>
  );
}
