import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/common/AnimatedSection";

export const metadata: Metadata = {
    title: "Insights — Webcoin Labs",
    description: "Research, announcements, and ecosystem intelligence from Webcoin Labs.",
};

const posts = [
    {
        slug: "webcoin-labs-2-0-announcement",
        tag: "Announcement",
        title: "Introducing Webcoin Labs 2.0",
        excerpt: "We're rebooting as a builder-first innovation hub. Here's the full story, and what to expect next.",
        date: "Feb 2026",
        readTime: "5 min read",
        href: "/webcoin-labs-2-0",
    },
    {
        slug: "why-base",
        tag: "Ecosystem",
        title: "Why Base is Our First Ecosystem Track",
        excerpt: "Base's developer momentum and Coinbase infrastructure make it the ideal first track for our builder programs.",
        date: "Feb 2026",
        readTime: "4 min read",
        href: "/insights/why-base",
    },
    {
        slug: "builder-program-cohort-1",
        tag: "Program",
        title: "Builder Program — Cohort 1 Overview",
        excerpt: "8 weeks. Real projects. Ecosystem support. A breakdown of how our first cohort works, who it's for, and how to apply.",
        date: "Mar 2026",
        readTime: "6 min read",
        href: "/insights/builder-program-cohort-1",
    },
    {
        slug: "what-builder-first-means",
        tag: "Philosophy",
        title: "What 'Builder-First' Actually Means",
        excerpt: "The term gets thrown around a lot. Here's what it means at Webcoin Labs in practice.",
        date: "Mar 2026",
        readTime: "3 min read",
        href: "/insights/what-builder-first-means",
    },
];

export default function InsightsPage() {
    return (
        <div className="min-h-screen pt-24">
            <section className="py-20 container mx-auto px-6">
                <AnimatedSection className="text-center mb-16">
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-4">Insights</p>
                    <h1 className="text-5xl font-bold tracking-tight mb-4">
                        Research &amp; <span className="gradient-text">Intelligence</span>
                    </h1>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Announcements, ecosystem analysis, and perspectives from the Webcoin Labs team.
                    </p>
                </AnimatedSection>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {posts.map((post, i) => (
                        <AnimatedSection key={post.slug} delay={i * 0.08}>
                            <Link href={post.href} className="group block h-full">
                                <div className="h-full p-6 rounded-xl border border-border/50 bg-card hover:border-cyan-500/30 hover:bg-accent/20 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent text-muted-foreground">
                                            {post.tag}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{post.date}</span>
                                    </div>
                                    <h2 className="font-bold text-lg mb-2 group-hover:text-cyan-400 transition-colors leading-snug">
                                        {post.title}
                                    </h2>
                                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{post.excerpt}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">{post.readTime}</span>
                                        <span className="text-xs text-cyan-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                                            Read <ArrowRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </AnimatedSection>
                    ))}
                </div>
            </section>
        </div>
    );
}
