"use client";

import { Calendar } from "lucide-react";
import { useCalendly } from "@/components/providers/CalendlyProvider";
import { AnimatedSection } from "@/components/common/AnimatedSection";

export function ServicesPageCTA() {
  const openCalendly = useCalendly();

  return (
    <AnimatedSection className="mt-16 text-center">
      <p className="text-sm text-muted-foreground mb-4">Want to discuss how we can help?</p>
      <button
        onClick={openCalendly}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        <Calendar className="w-4 h-4" /> Book a Demo
      </button>
    </AnimatedSection>
  );
}
