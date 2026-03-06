import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, User, Search, Users, Handshake, Coins, Share2 } from "lucide-react";
import { AnimatedSection } from "@/components/common/AnimatedSection";

export const metadata: Metadata = {
  title: "Products — Webcoin Labs",
  description: "Builder identity, project discovery, ecosystem access, stablecoin infrastructure. Products built by Webcoin Labs.",
};

const products = [
  { icon: User, title: "Builder Identity", href: "/app/profile", desc: "Verified profiles for builders and founders. One place to showcase who you are and what you build." },
  { icon: Search, title: "Project Discovery", href: "/projects", desc: "Public directories for projects and talent. Discover ideas across the network." },
  { icon: Users, title: "Startup Network", href: "/builders", desc: "Connect with builders and founders. Browse the ecosystem." },
  { icon: Handshake, title: "Ecosystem Introductions", href: "/app/intros/new", desc: "Request intros to partners, VCs, and KOLs. Curated, not open lists." },
  { icon: Coins, title: "Stablecoin Infrastructure", href: "/build", desc: "Fintech and stablecoin support for the future of payments." },
  { icon: Share2, title: "Distribution Network", href: "/network", desc: "Access to launchpads, CEXs, and media. Network access, not guaranteed listings." },
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <AnimatedSection className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Products built by Webcoin Labs
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Builder infrastructure for blockchain and stablecoin startups. Identity, discovery, access, and distribution.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((p, i) => {
            const Icon = p.icon;
            return (
              <AnimatedSection key={p.title} delay={i * 0.06}>
                <Link
                  href={p.href}
                  className="block p-6 rounded-2xl border border-border/50 bg-card hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/5 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-violet-400" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">{p.title}</h2>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </Link>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </div>
  );
}
