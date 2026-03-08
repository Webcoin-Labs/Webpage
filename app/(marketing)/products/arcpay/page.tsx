import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/common/AnimatedSection";

export const metadata: Metadata = {
  title: "ArcPay — Webcoin Labs",
  description:
    "Payment gateway and merchant infrastructure built on Arc. Blockchain-native payments, checkout flows, and programmable settlement.",
};

const features = [
  "Merchant checkout flows",
  "Payment infrastructure on Arc",
  "Blockchain payment support",
  "Future-ready settlement systems",
];

const steps = [
  "Integrate ArcPay into your app or merchant flow.",
  "Accept blockchain-native payments and stablecoins.",
  "Configure settlement and treasury rules.",
  "Scale with programmable payment infrastructure.",
];

export default function ArcPayProductPage() {
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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            ARC Builder
          </div>
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Payments Infrastructure
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            ArcPay
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Payment gateway and merchant infrastructure built on Arc. Blockchain-native payments, merchant checkout flows, and programmable settlement infrastructure.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.1} className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-4">What it does</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            ArcPay is a payment gateway and merchant infrastructure built on Arc. It enables blockchain-native payments, merchant checkout flows, and programmable settlement infrastructure for projects and businesses.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.15} className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Key features</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
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
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-400 text-sm font-medium">
                  {i + 1}
                </span>
                <p className="text-muted-foreground pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </AnimatedSection>

        <AnimatedSection delay={0.25}>
          <div className="rounded-2xl border border-violet-500/20 bg-card/80 p-8 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">Build on Arc</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Learn more and integrate ArcPay for your payment infrastructure.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="https://arcpay.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-violet-500 text-white px-6 py-3 text-sm font-medium hover:bg-violet-500/90 transition-colors"
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
