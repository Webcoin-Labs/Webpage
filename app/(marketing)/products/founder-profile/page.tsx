import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/common/AnimatedSection";

export const metadata: Metadata = {
  title: "Founder Profile — Webcoin Labs",
  description:
    "The identity layer of Webcoin Labs. Create verified founder and builder profiles, showcase projects, connect with collaborators, and unlock ecosystem opportunities.",
};

const features = [
  "Founder identity profile",
  "Builder profile",
  "Project creation",
  "Connect founders with builders",
  "Discover collaborators",
  "Build a public founder presence",
  "Prepare projects for fundraising",
  "Access ecosystem introductions",
];

const steps = [
  "Create your founder or builder profile with skills, chain focus, and intent.",
  "Add or claim your project and link it to your profile.",
  "Get discovered by founders or builders and request introductions.",
  "Unlock ecosystem access and fundraising readiness through the network.",
];

export default function FounderProfileProductPage() {
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
          <span className="inline-block px-2.5 py-1 rounded-md border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 text-xs font-medium mb-4">
            Core Platform
          </span>
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Network Infrastructure
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Founder Profile
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            The identity layer of Webcoin Labs. Create verified profiles, showcase projects, connect with collaborators, and unlock ecosystem opportunities.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.1} className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-4">What it does</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Founder Profile is the identity and network layer of Webcoin Labs. It allows founders and builders to create verified profiles, showcase projects, connect with collaborators, and unlock ecosystem opportunities. Creating a profile unlocks the Webcoin Labs builder network.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.15} className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Key features</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </AnimatedSection>

        <AnimatedSection delay={0.2} className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6">How it works</h2>
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-medium">
                  {i + 1}
                </span>
                <p className="text-muted-foreground pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </AnimatedSection>

        <AnimatedSection delay={0.25}>
          <div className="rounded-2xl border border-cyan-500/20 bg-card/80 p-8 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">Ready to join the network?</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your founder or builder profile and unlock the Webcoin Labs ecosystem.
            </p>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-500 text-white px-6 py-3 text-sm font-medium hover:bg-cyan-500/90 transition-colors"
            >
              Create Profile <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
