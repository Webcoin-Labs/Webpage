"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, User, CreditCard, Gamepad2, LayoutDashboard } from "lucide-react";

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

const riddlepayFeatures = [
  "Gamified rewards",
  "User engagement campaigns",
  "Interactive participation systems",
];

const kreatorboardFeatures = [
  "Influencer campaign management",
  "Creator performance tracking",
  "Structured growth workflows",
];

function ArcBuilderBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      ARC Builder
    </div>
  );
}

export function ProductsSection() {
  return (
    <section className="py-24 border-b border-border bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 rounded-full bg-cyan-500/5 blur-[100px]" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 rounded-full bg-violet-500/5 blur-[80px]" />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
            Products Built by Webcoin Labs
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Infrastructure products built to help founders launch, grow, and scale blockchain projects.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* 1. Founder Profile — PRIMARY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            className="lg:col-span-1"
          >
            <div className="group h-full flex flex-col p-6 lg:p-8 rounded-2xl border border-cyan-500/20 bg-card/80 backdrop-blur-sm shadow-[0_0_40px_-12px_rgba(34,211,238,0.15)] hover:shadow-[0_0_50px_-10px_rgba(34,211,238,0.2)] hover:border-cyan-500/30 transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-md border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 text-xs font-medium">
                  Core Platform
                </span>
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                Network Infrastructure
              </p>
              <h3 className="text-xl font-semibold text-foreground mb-2">Founder Profile</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed flex-grow">
                Founder Profile is the identity layer of Webcoin Labs. It allows founders and builders to create verified profiles, showcase projects, connect with collaborators, and unlock ecosystem opportunities.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 mb-6">
                {founderFeatures.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-cyan-400/90 mb-6">
                Creating a profile unlocks the Webcoin Labs builder network.
              </p>
              <div className="flex flex-wrap gap-2 mt-auto">
                <Link
                  href="/app"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-500/90 transition-colors"
                >
                  Create Profile
                </Link>
                <Link
                  href="/products/founder-profile"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-transparent text-sm font-medium text-foreground hover:bg-accent transition-colors"
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
            <div className="group h-full flex flex-col p-6 lg:p-8 rounded-2xl border border-border bg-card/80 backdrop-blur-sm hover:shadow-[0_0_30px_-10px_rgba(139,92,246,0.1)] hover:border-violet-500/20 transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400">
                  <CreditCard className="w-6 h-6" />
                </div>
                <ArcBuilderBadge />
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                Payments Infrastructure
              </p>
              <h3 className="text-xl font-semibold text-foreground mb-2">ArcPay</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed flex-grow">
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
              <div className="flex flex-wrap gap-2 mt-auto">
                <Link
                  href="/products/arcpay"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  Read More <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://arcpay.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-500/10 text-violet-400 text-sm font-medium hover:bg-violet-500/20 transition-colors"
                >
                  Launch Website
                </a>
              </div>
            </div>
          </motion.div>

          {/* 3. RiddlePay */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="group h-full flex flex-col p-6 lg:p-8 rounded-2xl border border-border bg-card/80 backdrop-blur-sm hover:shadow-[0_0_30px_-10px_rgba(34,197,94,0.1)] hover:border-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 mb-4">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                Engagement Infrastructure
              </p>
              <h3 className="text-xl font-semibold text-foreground mb-2">RiddlePay</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed flex-grow">
                RiddlePay is a gamified engagement and rewards platform designed to increase participation and interaction across blockchain communities and products.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 mb-6">
                {riddlepayFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 mt-auto">
                <Link
                  href="/products/riddlepay"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  Read More <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://riddlepay.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                >
                  Launch Website
                </a>
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
            <div className="group h-full flex flex-col p-6 lg:p-8 rounded-2xl border border-border bg-card/60 backdrop-blur-sm hover:shadow-soft hover:border-amber-500/20 transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs font-medium">
                  Live Beta
                </span>
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                Creator Infrastructure
              </p>
              <h3 className="text-xl font-semibold text-foreground mb-2">Kreatorboard</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed flex-grow">
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
              <div className="flex flex-wrap gap-2 mt-auto">
                <Link
                  href="/products/kreatorboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  Read More <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/app/kols-premium"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors"
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
