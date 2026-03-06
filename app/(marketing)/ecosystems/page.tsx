import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { AnimatedSection } from "@/components/common/AnimatedSection";

export const metadata: Metadata = {
    title: "Ecosystems — Webcoin Labs",
    description: "Ecosystem tracks: builder programs across Base, Arc, and more.",
};

const ecosystems = [
    {
        name: "Base",
        chain: "Layer 2 · Coinbase",
        status: "active",
        description:
            "Our first active ecosystem track. Base's developer momentum, Coinbase infrastructure, and strong tooling make it the ideal starting point for our builder programs.",
        features: ["Builder cohort programs", "Ecosystem grants support", "Technical mentorship", "Demo day access"],
        link: "https://base.org",
        gradient: "from-blue-500 to-cyan-400",
    },
    {
        name: "Arc",
        chain: "Coming Soon",
        status: "coming",
        description:
            "Arc ecosystem track is in planning. Strong infrastructure alignment and developer community make it a natural next track.",
        features: ["Builder cohort planned", "Ecosystem advisory", "Community programs"],
        link: "#",
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
            <section className="py-20 container mx-auto px-6">
                <AnimatedSection className="text-center mb-16">
                    <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">Ecosystems</p>
                    <h1 className="text-5xl font-bold tracking-tight mb-4">
                        Ecosystem <span className="gradient-text">Tracks</span>
                    </h1>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        We partner with blockchain ecosystems to design and run builder programs.
                        Builders get support, ecosystems get quality talent.
                    </p>
                </AnimatedSection>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {ecosystems.map((eco, i) => (
                        <AnimatedSection key={eco.name} delay={i * 0.1}>
                            <div className={`h-full p-6 rounded-2xl border border-border/50 bg-card hover:border-cyan-500/20 transition-all ${eco.status === "coming" || eco.status === "planned" ? "opacity-75" : ""}`}>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${eco.gradient} mb-4 flex items-center justify-center text-white font-bold`}>
                                    {eco.name.charAt(0)}
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="font-bold text-lg">{eco.name}</h2>
                                    {eco.status === "active" && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Active</span>
                                    )}
                                    {eco.status === "coming" && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">Planned</span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mb-4">{eco.chain}</p>
                                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{eco.description}</p>
                                <ul className="space-y-1.5 mb-6">
                                    {eco.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="w-1 h-1 rounded-full bg-cyan-400" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                {eco.status === "active" && (
                                    <a href={eco.link} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                                        Visit {eco.name} <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                                {eco.status === "planned" && (
                                    <Link href="/contact" className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                                        Explore partnership <ArrowRight className="w-3 h-3" />
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
