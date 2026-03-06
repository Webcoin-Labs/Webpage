"use client";

import Link from "next/link";
import { ArrowRight, Calendar, FileText } from "lucide-react";
import { HeroBackground } from "@/components/common/HeroBackground";
import { useCalendly } from "@/components/providers/CalendlyProvider";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { StatsCounter } from "@/components/common/StatsCounter";

const stats = [
  { value: 500, suffix: "K+", label: "Community Reach" },
  { value: 500, suffix: "+", label: "KOL Network" },
  { value: 100, suffix: "+", label: "Projects Supported" },
  { value: 30, suffix: "+", label: "Ecosystem Partners" },
];

export function HeroSection() {
  const openCalendly = useCalendly();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <HeroBackground />

      <div className="relative z-10 container mx-auto px-6 text-center pt-20">
        <AnimatedSection delay={0.1}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Builder infrastructure for blockchain and stablecoin startups
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
            Webcoin Labs 2.0
          </h1>
          <p className="text-xl sm:text-2xl text-foreground/90 font-medium mb-4">
            Infrastructure for the next generation
            <br />
            of blockchain and stablecoin startups.
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-10">
            Connecting builders, founders, ecosystems, and users into a single network.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.35}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <Link
              href="/products"
              className="group px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold text-sm hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              Explore Platform
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={openCalendly}
              className="px-8 py-3.5 rounded-xl border-2 border-border hover:border-cyan-500/50 text-foreground/90 text-sm font-medium hover:bg-accent/50 transition-all flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Book a Demo
            </button>
            <Link
              href="/pitchdeck"
              className="px-8 py-3.5 rounded-xl border-2 border-violet-500/40 bg-violet-500/10 text-violet-400 text-sm font-medium hover:bg-violet-500/20 transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View Pitch Deck
            </Link>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.5} className="mt-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <StatsCounter value={stat.value} suffix={stat.suffix} />
                <p className="text-xs text-foreground/80 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="w-px h-12 bg-gradient-to-b from-cyan-500/50 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
