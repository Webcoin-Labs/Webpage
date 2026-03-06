"use client";

import { motion } from "framer-motion";
import {
  Users,
  TrendingDown,
  ShieldAlert,
  Megaphone,
  Scale,
  Smartphone,
  Target,
  Puzzle,
} from "lucide-react";

const problems = [
  {
    icon: Users,
    title: "Fragmented builder ecosystem",
    desc: "Developers, founders, and projects are scattered across chains and communities.",
  },
  {
    icon: TrendingDown,
    title: "Low traction for real products",
    desc: "Many projects fail to reach users despite strong technology.",
  },
  {
    icon: ShieldAlert,
    title: "Trust issues and scams",
    desc: "The industry suffers from scams and low transparency.",
  },
  {
    icon: Megaphone,
    title: "Weak distribution",
    desc: "Blockchain startups struggle with marketing, SEO, and user acquisition.",
  },
  {
    icon: Scale,
    title: "Regulatory uncertainty",
    desc: "Crypto and stablecoin businesses face unclear compliance rules globally.",
  },
  {
    icon: Smartphone,
    title: "Poor user experience",
    desc: "Wallet onboarding and crypto UX are still complex for mainstream users.",
  },
  {
    icon: Target,
    title: "Lack of product-market fit",
    desc: "Many blockchain startups fail because products are built without real demand.",
  },
  {
    icon: Puzzle,
    title: "Fragmented infrastructure",
    desc: "Developers rely on many vendors and tools across chains, slowing development.",
  },
];

export function ProblemsSection() {
  return (
    <section className="py-24 border-y border-border/50 bg-muted/20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3">
            Industry challenges
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Problems we see in the blockchain industry
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Clear product messaging. Real issues. Real solutions.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {problems.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="group p-5 rounded-xl border border-border/50 bg-card/80 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 hover:scale-[1.02] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3 group-hover:bg-amber-500/20 transition-colors">
                  <Icon className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-1.5 text-sm">
                  {p.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {p.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
