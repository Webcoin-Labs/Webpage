"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, User, CreditCard, IdCard, LayoutDashboard } from "lucide-react";

const founderFeatures = [
  "Founder identity profile",
  "Builder profile",
  "Project creation",
  "Connect founders with builders",
  "Discover collaborators",
  "Build a public founder presence",
  "Prepare projects for fundraising",
  "Access ecosystem introductions",
];

const arcpayFeatures = [
  "Merchant checkout flows",
  "Payment infrastructure on Arc",
  "Blockchain payment support",
  "Future-ready settlement systems",
];

const arcBuilderCardFeatures = [
  "Arc developer verification",
  "Soulbound NFT builder identity",
  "One-click on-chain mint flow",
  "Portable reputation credential",
];

const kreatorboardFeatures = [
  "Influencer campaign management",
  "Creator performance tracking",
  "Structured growth workflows",
];

function ArcBuilderBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/70 bg-background text-foreground text-xs font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      ARC Builder
    </div>
  );
}

export function ProductsSection() {
  return (
    <section className="py-24 border-b border-border bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.06),transparent_55%)]" />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground mb-3">
            Product suite
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
            Products Built by Webcoin Labs
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
            A focused operating stack for founders: identity, payments, on-chain credentials, and creator-led growth.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {/* 1. Founder Profile — PRIMARY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            className="lg:col-span-1"
          >
            <div className="group h-full min-h-[540px] flex flex-col p-6 lg:p-7 rounded-2xl border border-border/70 bg-card transition-colors duration-300 hover:border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-lg bg-accent flex items-center justify-center text-foreground transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-md border border-border/70 bg-background text-foreground text-xs font-medium">
                  Core Platform
                </span>
              </div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-1">
                Network Infrastructure
              </p>
              <h3 className="text-xl font-semibold text-foreground mb-2">Founder Profile</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Founder Profile is the identity layer of Webcoin Labs. It allows founders and builders to create verified profiles, showcase projects, connect with collaborators, and unlock ecosystem opportunities.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 mb-6">
                {founderFeatures.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mb-5">
                Creating a profile unlocks the Webcoin Labs builder network.
              </p>
              <div className="mt-auto flex flex-col gap-2">
                <Link
                  href="/app"
                  className="inline-flex w-full items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
                >
                  Create Profile
                </Link>
                <Link
                  href="/products/founder-profile"
                  className="inline-flex w-full items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-border bg-background text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  Read More <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* 2. ArcPay */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
          >
            <div className="group h-full min-h-[540px] flex flex-col p-6 lg:p-7 rounded-2xl border border-border/70 bg-card transition-colors duration-300 hover:border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-lg bg-accent flex items-center justify-center text-foreground">
                  <CreditCard className="w-6 h-6" />
                </div>
                <ArcBuilderBadge />
              </div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-1">
                Payments Infrastructure
              </p>
              <h3 className="text-xl font-semibold text-foreground mb-2">ArcPay</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                ArcPay is a payment gateway and merchant infrastructure built on Arc. It enables blockchain-native payments, merchant checkout flows, and programmable settlement infrastructure.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 mb-6">
                {arcpayFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-violet-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-2">
                <Link
                  href="/products/arcpay"
                  className="inline-flex w-full items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-border bg-background text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  Read More <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://arcpay.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-border/70 bg-background text-foreground text-sm font-medium hover:bg-accent transition-colors"
                >
                  Launch Website
                </a>
              </div>
            </div>
          </motion.div>

          {/* 3. Arc Builder Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="group h-full min-h-[540px] flex flex-col p-6 lg:p-7 rounded-2xl border border-border/70 bg-card transition-colors duration-300 hover:border-border">
              <div className="w-11 h-11 rounded-lg bg-accent flex items-center justify-center text-foreground mb-4">
                <IdCard className="w-6 h-6" />
              </div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-1">
                On-Chain Identity Infrastructure
              </p>
              <h3 className="text-xl font-semibold text-foreground mb-2">Generate your Arc Builder Card</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                A next-gen builder identity product for the Arc ecosystem. Developers and builders can generate their
                Arc Builder Card, mint an SBT NFT, and create a verifiable on-chain proof of contribution.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 mb-6">
                {arcBuilderCardFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-2">
                <Link
                  href="/app"
                  className="inline-flex w-full items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-border bg-background text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  Generate Card <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex w-full items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-border/70 bg-background text-foreground text-sm font-medium hover:bg-accent transition-colors"
                >
                  Join Waitlist
                </Link>
              </div>
            </div>
          </motion.div>

          {/* 4. Kreatorboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            <div className="group h-full min-h-[540px] flex flex-col p-6 lg:p-7 rounded-2xl border border-border/70 bg-card transition-colors duration-300 hover:border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-lg bg-accent flex items-center justify-center text-foreground">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-md border border-border/70 bg-background text-foreground text-xs font-medium">
                  Live Beta
                </span>
              </div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-1">
                Creator Infrastructure
              </p>
              <h3 className="text-xl font-semibold text-foreground mb-2">Kreatorboard</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Kreatorboard is a creator and KOL operations dashboard for campaign management, performance tracking, and structured growth workflows.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 mb-6">
                {kreatorboardFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-2">
                <Link
                  href="/products/kreatorboard"
                  className="inline-flex w-full items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-border bg-background text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  Read More <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/app/kols-premium"
                  className="inline-flex w-full items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-border/70 bg-background text-foreground text-sm font-medium hover:bg-accent transition-colors"
                >
                  Open Module
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border bg-background hover:bg-accent text-foreground text-sm font-medium transition-all"
          >
            See all products <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
