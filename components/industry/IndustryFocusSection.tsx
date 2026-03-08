"use client";

import { motion } from "framer-motion";
import { Coins, Building2, Blocks } from "lucide-react";

const verticals = [
  {
    icon: Coins,
    title: "Stablecoins",
    desc: "Becoming a major infrastructure for payments and financial settlement.",
  },
  {
    icon: Building2,
    title: "Fintech Infrastructure",
    desc: "Bridges between traditional finance and blockchain rails.",
  },
  {
    icon: Blocks,
    title: "Blockchain Applications",
    desc: "Consumer and enterprise products built on decentralized infrastructure.",
  },
];

export function IndustryFocusSection() {
  return (
    <section className="py-24 bg-background border-b border-border">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-border bg-accent text-muted-foreground text-xs font-medium mb-6">
            Core Verticals
          </div>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
            Focused on the future of finance
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The three verticals where Webcoin Labs adds the most infrastructural value.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {verticals.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 rounded-2xl border border-border bg-card hover:shadow-soft transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{v.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
