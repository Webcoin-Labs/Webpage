import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { AnimatedSection } from "@/components/common/AnimatedSection";

export const metadata: Metadata = {
  title: "Ecosystems - Webcoin Labs",
  description: "Ecosystem tracks: builder programs across Base, Arc, and more.",
};

const ecosystems = [
  {
    name: "Base",
    chain: "Layer 2 - Coinbase",
    status: "active",
    description:
      "Our first active ecosystem track. Base's developer momentum, Coinbase infrastructure, and strong tooling make it the ideal starting point for our builder programs.",
    features: ["Builder cohort programs", "Ecosystem grants support", "Technical mentorship", "Demo day access"],
    link: "https://base.org",
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    name: "Arc",
    chain: "Planned Track",
    status: "planned",
    description:
      "Arc ecosystem track is in planning. Strong infrastructure alignment and developer community make it a natural next track.",
    features: ["Builder cohort planned", "Ecosystem advisory", "Community programs"],
    link: "/contact",
    gradient: "from-violet-500 to-purple-400",
  },
  {
    name: "More Ecosystems",
    chain: "2026 Roadmap",
    status: "planned",
    description:
      "We evaluate ecosystems based on builder demand, infrastructure quality, and grant availability. Interested in bringing Webcoin Labs to your ecosystem?",
    features: ["Contact us to explore", "Ecosystem retainer model", "Custom program design"],
    link: "/contact",
    gradient: "from-slate-500 to-slate-400",
  },
];

export default function EcosystemsPage() {
  return (
    <div className="min-h-screen pt-24">
      <section className="container mx-auto px-6 py-20">
        <AnimatedSection className="mb-16 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-violet-400">Ecosystems</p>
          <h1 className="mb-4 text-5xl font-bold tracking-tight">
            Ecosystem <span className="gradient-text">Tracks</span>
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            We partner with blockchain ecosystems to design and run builder programs. Builders get support,
            ecosystems get quality talent.
          </p>
        </AnimatedSection>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {ecosystems.map((eco, i) => (
            <AnimatedSection key={eco.name} delay={i * 0.1}>
              <div
                className={`h-full rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-cyan-500/20 ${
                  eco.status !== "active" ? "opacity-85" : ""
                }`}
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${eco.gradient} font-bold text-white`}
                >
                  {eco.name.charAt(0)}
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <h2 className="text-lg font-bold">{eco.name}</h2>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${
                      eco.status === "active"
                        ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                        : "border-violet-500/20 bg-violet-500/10 text-violet-400"
                    }`}
                  >
                    {eco.status === "active" ? "Active" : "Planned"}
                  </span>
                </div>
                <p className="mb-4 text-xs text-muted-foreground">{eco.chain}</p>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{eco.description}</p>
                <ul className="mb-6 space-y-1.5">
                  {eco.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-1 w-1 rounded-full bg-cyan-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                {eco.status === "active" ? (
                  <a
                    href={eco.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-cyan-400 transition-colors hover:text-cyan-300"
                  >
                    Visit {eco.name} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <Link
                    href={eco.link}
                    className="inline-flex items-center gap-1.5 text-xs text-violet-400 transition-colors hover:text-violet-300"
                  >
                    Explore partnership <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>
    </div>
  );
}
