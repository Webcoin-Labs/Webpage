import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/common/AnimatedSection";

export const metadata: Metadata = {
  title: "RiddlePay — Webcoin Labs",
  description:
    "Gamified engagement and rewards platform for blockchain communities. Increase participation and interaction.",
};

const features = [
  "Gamified rewards",
  "User engagement campaigns",
  "Interactive participation systems",
];

const steps = [
  "Integrate RiddlePay into your community or product.",
  "Design quests, challenges, and reward campaigns.",
  "Drive participation and track engagement.",
  "Scale community growth with structured incentives.",
];

export default function RiddlePayProductPage() {
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
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Engagement Infrastructure
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            RiddlePay
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Gamified engagement and rewards platform designed to increase participation and interaction across blockchain communities and products.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.1} className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-4">What it does</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            RiddlePay is a gamified engagement and rewards platform. It helps projects and communities run campaigns, reward participation, and build interactive experiences that drive growth and retention.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.15} className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Key features</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
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
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-sm font-medium">
                  {i + 1}
                </span>
                <p className="text-muted-foreground pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </AnimatedSection>

        <AnimatedSection delay={0.25}>
          <div className="rounded-2xl border border-emerald-500/20 bg-card/80 p-8 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">Engage your community</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Learn more and integrate RiddlePay for gamified engagement.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="https://riddlepay.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 text-white px-6 py-3 text-sm font-medium hover:bg-emerald-500/90 transition-colors"
              >
                Launch Website <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                Contact us
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
