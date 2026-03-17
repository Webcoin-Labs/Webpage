import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Crown } from "lucide-react";
import { AnimatedSection } from "@/components/common/AnimatedSection";

export const metadata: Metadata = {
  title: "Kreatorboard - Webcoin Labs",
  description:
    "Creator and KOL operations dashboard. Manage influencer campaigns, track creator performance, and organize growth workflows.",
};

const features = [
  "Influencer campaign management",
  "Creator performance tracking",
  "Structured growth workflows",
  "Premium KOL intro routing",
];

const steps = [
  "Create a KOL campaign request with goals, budget, timeline, and region.",
  "Route requests through standard or premium priority tiers.",
  "Track matching progress and request status from your dashboard.",
  "Coordinate execution with founder profile and project context.",
];

export default function KreatorboardProductPage() {
  return (
    <div className="min-h-screen pb-20 pt-24">
      <div className="container mx-auto max-w-4xl px-6">
        <Link
          href="/products"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All products
        </Link>

        <AnimatedSection className="mb-16">
          <span className="mb-4 inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
            <Crown className="h-3.5 w-3.5" />
            Live Beta Module
          </span>
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">Creator Infrastructure</p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">Kreatorboard</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            A creator and KOL operations dashboard for campaigns, creator performance, and structured growth workflows.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.1} className="mb-16">
          <h2 className="mb-4 text-2xl font-semibold text-foreground">What it does</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            Kreatorboard centralizes creator operations for Web3 projects: campaign planning, KOL tracking,
            collaboration workflows, and post-campaign reporting in one dashboard.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.15} className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-foreground">Core features</h2>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-muted-foreground">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {f}
              </li>
            ))}
          </ul>
        </AnimatedSection>

        <AnimatedSection delay={0.2} className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-foreground">How teams use it</h2>
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-sm font-medium text-amber-400">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-muted-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </AnimatedSection>

        <AnimatedSection delay={0.25}>
          <div className="rounded-2xl border border-amber-500/20 bg-card/80 p-8 text-center">
            <h3 className="mb-2 text-xl font-semibold text-foreground">Open the Kreatorboard module</h3>
            <p className="mx-auto mb-6 max-w-md text-muted-foreground">
              Founders can manage premium KOL intro campaigns directly inside the app.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/app/kols-premium"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90"
              >
                Open KOL Premium <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Talk to the team
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
