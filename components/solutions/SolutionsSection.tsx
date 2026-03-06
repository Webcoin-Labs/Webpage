"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  User,
  Search,
  Globe,
  Share2,
  Coins,
  Network,
  ArrowRight,
} from "lucide-react";

const solutions = [
  { icon: User, label: "Builder identity" },
  { icon: Search, label: "Project discovery" },
  { icon: Globe, label: "Ecosystem access" },
  { icon: Share2, label: "Distribution channels" },
  { icon: Coins, label: "Stablecoin fintech infrastructure" },
  { icon: Network, label: "Network introductions" },
];

export function SolutionsSection() {
  return (
    <section className="py-24 border-b border-border/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">
            Our approach
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4 max-w-3xl mx-auto">
            Rebuilding the infrastructure layer for Web3 builders
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
            Webcoin Labs solves industry fragmentation by providing builder identity, project discovery, ecosystem access, distribution channels, stablecoin fintech infrastructure, and network introductions.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 font-medium text-sm border border-cyan-500/30 transition-all"
          >
            Explore products <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3">
          {solutions.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-cyan-400/90 text-sm font-medium"
              >
                <Icon className="w-4 h-4" />
                {s.label}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
