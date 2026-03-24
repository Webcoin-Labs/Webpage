import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — Webcoin Labs",
  description: "Simple pricing for founders and teams building with Webcoin Labs.",
};

const tiers = [
  {
    name: "Starter",
    price: "Free",
    subtitle: "Early founder validation",
    features: [
      "Founder profile and project listing",
      "Builder discovery and matching",
      "Basic intro request flow",
      "Community events access",
    ],
    cta: { label: "Get started", href: "/app" },
  },
  {
    name: "Webcoin Plus",
    price: "$20/mo",
    subtitle: "Founder growth + premium discovery",
    features: [
      "KOL Premium access and priority routing",
      "Up to 10 startup profiles",
      "Founder network visibility and ratings",
      "Pitch deck builder from scratch (coming soon)",
    ],
    cta: { label: "Upgrade to Plus", href: "/contact" },
    highlighted: true,
  },
  {
    name: "Studio",
    price: "Custom",
    subtitle: "Hands-on partner support",
    features: [
      "Dedicated acceleration support",
      "Partner ecosystem introductions",
      "Custom token/finance advisory",
      "Quarterly growth planning",
    ],
    cta: { label: "Talk to sales", href: "/contact" },
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen py-24">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Pricing</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Choose the right acceleration tier</h1>
          <p className="mt-4 text-sm text-muted-foreground md:text-base">
            Start free, then upgrade when you need advanced analysis, matching depth, and growth support.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-6 ${tier.highlighted ? "border-cyan-500/50 bg-cyan-500/5" : "border-border/60 bg-card/70"}`}
            >
              <p className="text-sm font-medium text-muted-foreground">{tier.name}</p>
              <p className="mt-2 text-3xl font-bold">{tier.price}</p>
              <p className="mt-1 text-sm text-muted-foreground">{tier.subtitle}</p>

              <ul className="mt-5 space-y-2 text-sm">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.cta.href}
                className={`mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold ${
                  tier.highlighted ? "bg-cyan-500 text-white hover:bg-cyan-500/90" : "border border-border hover:bg-accent"
                }`}
              >
                {tier.cta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
