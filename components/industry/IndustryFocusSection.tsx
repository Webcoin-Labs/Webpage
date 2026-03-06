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
    <section className="py-24 border-b border-border/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3">
            Focus
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Focused on the future of finance
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Three verticals where Webcoin Labs adds the most value.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {verticals.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl border border-border/50 bg-card/80 hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
