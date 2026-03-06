import type { Metadata } from "next";
import { AnimatedSection } from "@/components/common/AnimatedSection";

export const metadata: Metadata = {
  title: "Case Studies — Webcoin Labs",
  description: "Stories from the Webcoin Labs network: problem, what we did, outcome.",
};

const caseStudies = [
  {
    tag: "Legacy · 2022",
    title: "Launchpad support",
    problem: "Projects needed community and KOL amplification for fair launches.",
    whatWeDid: "We provided community support and ecosystem introductions for projects launching on partner launchpads. No guaranteed numbers — we connected and amplified where fit.",
    outcome: "Multiple projects reached their community goals; relationships carried into later cohorts.",
  },
  {
    tag: "Legacy · 2021–2023",
    title: "Early-stage advisory",
    problem: "Early Web3 teams needed structured advisory without hype.",
    whatWeDid: "Advisory and tokenomics support for early-stage projects across DeFi, GameFi, and NFT. Fixed engagement model.",
    outcome: "Teams shipped with clearer positioning; no inflated outcome claims.",
  },
  {
    tag: "2026",
    title: "Builder cohort (Base)",
    problem: "Ecosystems need quality builder pipelines and program execution.",
    whatWeDid: "First Webcoin Labs 2.0 cohort: 8-week builder program on Base, ecosystem-sponsored. Recruitment, structure, and mentorship.",
    outcome: "Program in launch; outcomes will be shared transparently as we run cohorts.",
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen pt-24">
      <section className="py-20 container mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-4">Case Studies</p>
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Work that <span className="gradient-text">speaks</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Problem, what we did, outcome. No fake metrics — real stories from our network.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {caseStudies.map((study, i) => (
            <AnimatedSection key={study.title} delay={i * 0.1}>
              <div className="h-full p-6 rounded-2xl border border-border/50 bg-card hover:border-cyan-500/20 transition-all">
                <span className="text-xs font-medium text-muted-foreground">{study.tag}</span>
                <h2 className="font-bold text-lg mt-2 mb-4">{study.title}</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Problem</p>
                    <p className="text-muted-foreground leading-relaxed">{study.problem}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">What we did</p>
                    <p className="text-muted-foreground leading-relaxed">{study.whatWeDid}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Outcome</p>
                    <p className="text-muted-foreground leading-relaxed">{study.outcome}</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>
    </div>
  );
}
