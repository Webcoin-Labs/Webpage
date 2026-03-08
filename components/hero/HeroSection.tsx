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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-background shadow-sm text-muted-foreground text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Infrastructure for Blockchain Startups
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.1] text-foreground mb-6">
            Connecting builders, founders,<br className="hidden sm:block" /> and ecosystems.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground font-normal max-w-2xl mx-auto mb-10 leading-relaxed">
            The standard platform for identity, discovery, and distribution in Web3. Build alongside the highest-signal network in the industry.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.35}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
            <Link
              href="/products"
              className="group px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium text-base hover:opacity-90 transition-all flex items-center gap-2 shadow-soft hover:shadow-soft-hover"
            >
              Explore Platform
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={openCalendly}
              className="px-6 py-3 rounded-full border border-border bg-background hover:bg-accent text-foreground text-base font-medium shadow-sm transition-all flex items-center gap-2"
            >
              Book Demo
            </button>
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
        <div className="w-px h-12 bg-gradient-to-b from-primary/30 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
