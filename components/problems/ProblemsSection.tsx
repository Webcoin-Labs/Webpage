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
    title: "Fragmented Ecosystem",
    desc: "Builders, capital, and infrastructure are scattered across disparate chains, creating massive friction for early-stage projects.",
  },
  {
    icon: Megaphone,
    title: "Distribution Roadblocks",
    desc: "Even technically excellent products fail to find traction and product-market fit due to isolated communities and weak distribution.",
  },
  {
    icon: ShieldAlert,
    title: "Trust & Credibility Gap",
    desc: "The industry frequently suffers from low transparency. It remains difficult for legitimate, high-quality founders to signal trust.",
  },
  {
    icon: Puzzle,
    title: "Complex Infrastructure",
    desc: "Development relies on a fragmented web of vendors and tools, slowing down execution speed and degrading the final user experience.",
  },
];

export function ProblemsSection() {
  return (
    <section className="py-24 md:py-32 bg-background border-y border-border">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12">
          {/* Left Column (Sticky Text) */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="sticky top-32"
            >
              <div className="inline-flex items-center px-3 py-1 rounded-full border border-border bg-accent text-muted-foreground text-xs font-medium mb-6">
                The Infrastructure Gap
              </div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-6 leading-[1.15]">
                The challenges facing modern blockchain builders.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Despite billions in capital and immense developer talent, shipping and scaling blockchain applications remains profoundly difficult. We exist to solve these fundamental bottlenecks.
              </p>
            </motion.div>
          </div>

          {/* Right Column (Stacked Cards) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {problems.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.1 }}
                  className="group p-8 rounded-2xl border border-border bg-card hover:bg-accent/50 hover:shadow-soft transition-all duration-300 flex items-start gap-6"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {p.title}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
