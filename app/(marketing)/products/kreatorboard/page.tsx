import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/common/AnimatedSection";

export const metadata: Metadata = {
  title: "Kreatorboard — Webcoin Labs",
  description:
    "Creator and KOL operations dashboard (coming soon). Manage influencer campaigns, track creator performance, and organize growth workflows.",
};

const features = [
  "Influencer campaign management",
  "Creator performance tracking",
  "Structured growth workflows",
];

const steps = [
  "Add creators and KOLs to your campaign dashboard.",
  "Track performance, reach, and engagement in one place.",
  "Organize campaigns and payouts with structured workflows.",
  "Scale creator-led growth with data and operations.",
];

export default function KreatorboardProductPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-4xl">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> All products
        </Link>

        <AnimatedSection className="mb-16">
          <span className="inline-block px-2.5 py-1 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs font-medium mb-4">
            Coming Soon
          </span>
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Creator Infrastructure
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Kreatorboard
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            A creator and KOL operations dashboard currently under development. It will allow projects to manage influencer campaigns, track creator performance, and organize structured growth workflows.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.1} className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-4">What it does</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Kreatorboard is a creator and KOL operations dashboard currently under development. It will let projects manage influencer campaigns, track creator performance, and organize structured growth workflows—all in one place.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.15} className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Key features (planned)</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </AnimatedSection>

        <AnimatedSection delay={0.2} className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6">How it will work</h2>
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 text-sm font-medium">
                  {i + 1}
                </span>
                <p className="text-muted-foreground pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </AnimatedSection>

        <AnimatedSection delay={0.25}>
          <div className="rounded-2xl border border-amber-500/20 bg-card/80 p-8 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">Get notified when Kreatorboard launches</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Join the waitlist and we&apos;ll notify you when the creator dashboard is ready.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 text-white px-6 py-3 text-sm font-medium hover:bg-amber-500/90 transition-colors"
            >
              Notify Me <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
