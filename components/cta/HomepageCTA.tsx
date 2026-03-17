"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";
import { useCalendly } from "@/components/providers/CalendlyProvider";
import { AnimatedSection } from "@/components/common/AnimatedSection";

export function HomepageCTA() {
  const openCalendly = useCalendly();

  return (
    <section className="py-32 container mx-auto px-6 text-center">
      <AnimatedSection>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-4">Get Started</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            Ready to build together?
          </h2>
          <p className="text-base text-muted-foreground mb-10">
            Whether you&apos;re a builder looking for programs, a founder seeking support, or an ecosystem exploring partnerships — let&apos;s talk.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={openCalendly}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Book a Demo
            </button>
            <Link
              href="/app/apply"
              className="px-8 py-3.5 rounded-xl border-2 border-border hover:border-cyan-500/50 text-foreground/90 text-sm font-medium transition-all hover:bg-accent/50"
            >
              Apply to a Program
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3.5 rounded-xl border-2 border-violet-500/40 bg-violet-500/10 text-violet-400 text-sm font-medium hover:bg-violet-500/20 transition-all"
            >
              Partner With Us
            </Link>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
