import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AnimatedSection } from "@/components/common/AnimatedSection";

export const metadata: Metadata = {
    title: "Introducing Webcoin Labs 2.0",
    description:
        "Formerly Webcoin Capital. A transparent look at our history, what changed, and where we're going.",
};

const timelineEvents = [
    {
        period: "2021 — 2023",
        label: "Legacy Era",
        color: "amber",
        title: "Webcoin Capital",
        description:
            "We launched as a community-backed capital platform supporting early-stage Web3 projects. Over two years, we built relationships with 500+ KOLs, supported 100+ projects, and created an ecosystem spanning VCs, launchpads, CEXs, and media partners. This was the ICO era — high energy, high risk.",
        highlights: [
            "500K+ community reach",
            "500+ KOL network",
            "100+ projects supported",
            "30+ ecosystem partners",
        ],
    },
    {
        period: "2024 — 2025",
        label: "Dormant",
        color: "slate",
        title: "A Necessary Pause",
        description:
            "Funding constraints and a challenging market environment led to a period of dormancy. We're being transparent about this because trust is built on honesty. The team used this time to rethink the model, study the ecosystem, and plan a sustainable path forward.",
        highlights: [],
    },
    {
        period: "2026",
        label: "Reboot",
        color: "cyan",
        title: "Webcoin Labs 2.0",
        description:
            "We're back — rebuilt from the ground up as a builder-first innovation hub. New model, new positioning, same network. The ICO era is over; the infrastructure era is here. We're focused on programs, partnerships, and genuine builder support.",
        highlights: [
            "Ecosystem retainers (sustainable revenue)",
            "Builder cohort programs",
            "Capital readiness advisory",
            "Research & intelligence sponsorships",
        ],
    },
];

const changes = {
    changed: [
        "No ICO-driven fundraising model",
        "No guaranteed listing promises",
        "No hype-first marketing",
        "Fee structure: retainers + advisory, not 10% cuts",
        "Focus: builders + product infrastructure, not just capital",
    ],
    stayed: [
        "Relationships with VCs, CEXs, launchpads, and KOLs",
        "Operator mindset and execution focus",
        "Commitment to Web3 ecosystem development",
        "Network credibility built 2021–2023",
        "Team: same core people, better framework",
    ],
};

export default function WebcoinLabs20Page() {
    return (
        <div className="min-h-screen pt-24">
            {/* Header */}
            <section className="py-20 container mx-auto px-6 text-center">
                <AnimatedSection>
                    <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-4">
                        Formerly Webcoin Capital
                    </p>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
                        Introducing{" "}
                        <span className="gradient-text">Webcoin Labs 2.0</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        A transparent look at where we came from, why we paused, and what
                        we&apos;re building for the next chapter of Web3.
                    </p>
                </AnimatedSection>
            </section>

            {/* Timeline */}
            <section className="py-20 container mx-auto px-6">
                <AnimatedSection className="text-center mb-16">
                    <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">Timeline</p>
                    <h2 className="text-3xl font-bold">Our story, honestly told</h2>
                </AnimatedSection>

                <div className="max-w-4xl mx-auto relative">
                    {/* Vertical line */}
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-amber-400 via-slate-600 to-cyan-400 opacity-30 md:-translate-x-1/2" />

                    <div className="space-y-12">
                        {timelineEvents.map((event, i) => {
                            const colorMap: Record<string, string> = {
                                amber: "bg-amber-400 border-amber-400/30 text-amber-400",
                                slate: "bg-slate-500 border-slate-500/30 text-slate-400",
                                cyan: "bg-cyan-400 border-cyan-400/30 text-cyan-400",
                            };
                            const dotColor = colorMap[event.color].split(" ")[0];
                            const textColor = colorMap[event.color].split(" ")[2];
                            const borderColor = colorMap[event.color].split(" ")[1];

                            return (
                                <AnimatedSection key={event.period} delay={i * 0.15}>
                                    <div className={`relative flex gap-8 md:gap-16 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                                        {/* Dot */}
                                        <div className="absolute left-8 md:left-1/2 w-4 h-4 rounded-full border-2 border-background -translate-y-1 md:-translate-x-1/2 z-10">
                                            <div className={`w-full h-full rounded-full ${dotColor}`} />
                                        </div>

                                        {/* Card */}
                                        <div className={`ml-20 md:ml-0 md:w-1/2 ${i % 2 === 1 ? "md:pr-16" : "md:pl-16"}`}>
                                            <div className={`p-6 rounded-xl border ${borderColor} bg-card`}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className={`text-xs font-bold uppercase tracking-widest ${textColor}`}>
                                                        {event.period}
                                                    </span>
                                                    <span className={`text-xs px-2.5 py-1 rounded-full border ${borderColor} ${textColor}`}>
                                                        {event.label}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-bold mb-3">{event.title}</h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                                    {event.description}
                                                </p>
                                                {event.highlights.length > 0 && (
                                                    <ul className="space-y-1.5">
                                                        {event.highlights.map((h) => (
                                                            <li key={h} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${textColor}`} />
                                                                {h}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </AnimatedSection>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* What Changed / What Stayed */}
            <section className="py-24 bg-muted/30 border-y border-border/50">
                <div className="container mx-auto px-6">
                    <AnimatedSection className="text-center mb-16">
                        <h2 className="text-3xl font-bold">What changed. What stayed.</h2>
                    </AnimatedSection>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <AnimatedSection delay={0.1}>
                            <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5">
                                <h3 className="font-bold mb-4 text-destructive">What Changed</h3>
                                <ul className="space-y-3">
                                    {changes.changed.map((item) => (
                                        <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                                            <span className="w-4 h-4 rounded-full border border-destructive/40 flex-shrink-0 mt-0.5 flex items-center justify-center">
                                                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                            </span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </AnimatedSection>

                        <AnimatedSection delay={0.2}>
                            <div className="p-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
                                <h3 className="font-bold mb-4 text-cyan-400">What Stayed</h3>
                                <ul className="space-y-3">
                                    {changes.stayed.map((item) => (
                                        <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                                            <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* 2021–2023: What we achieved */}
            <section id="achievements" className="py-24 border-t border-border/50 bg-background">
                <div className="container mx-auto px-6 max-w-3xl">
                    <AnimatedSection className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                            2021–2023: What we achieved
                        </h2>
                        <p className="text-muted-foreground text-base leading-relaxed">
                            During our active years we built real distribution capacity and network depth. All phrasing below is factual — we supported, partnered, collaborated, and onboarded; we do not promise guaranteed listings or funding.
                        </p>
                    </AnimatedSection>
                    <AnimatedSection delay={0.1}>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li><strong className="text-foreground">Community growth & distribution</strong> — 500K+ community reach, distribution capacity across channels.</li>
                            <li><strong className="text-foreground">Network depth</strong> — Launchpads, CEXs, VCs, and a large KOL network integrated into our workflow.</li>
                            <li><strong className="text-foreground">Portfolio support</strong> — Selected projects received partnerships, onboarding, campaigns, advisory, and allocation support.</li>
                            <li><strong className="text-foreground">Work types</strong> — Partnerships, onboarding, campaigns, advisory, and allocations. We collaborated with projects and ecosystem partners; no guarantees implied.</li>
                        </ul>
                        <div className="mt-10 text-center">
                            <Link
                                href="/network?tab=legacy"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors"
                            >
                                Legacy network <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 container mx-auto px-6 text-center">
                <AnimatedSection>
                    <h2 className="text-3xl font-bold mb-4">Ready to build with us?</h2>
                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                        This is the new era. Join as a builder, apply with your project, or explore how
                        your ecosystem can partner with Webcoin Labs.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/app"
                            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            Enter App <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/contact"
                            className="px-8 py-3.5 rounded-xl border border-border hover:bg-accent transition-colors text-sm font-medium"
                        >
                            Get in Touch
                        </Link>
                    </div>
                </AnimatedSection>
            </section>
        </div>
    );
}
