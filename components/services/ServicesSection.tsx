"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Briefcase,
  FileCheck,
  Globe,
  Megaphone,
  Rocket,
  Users,
  Target,
  Code2,
  ArrowRight,
} from "lucide-react";

const services = [
  { icon: Briefcase, title: "Venture Studio Support", href: "/app/apply/founder-support" },
  { icon: FileCheck, title: "Capital Readiness", href: "/app/apply/founder-support" },
  { icon: Globe, title: "Ecosystem Partnerships", href: "/network" },
  { icon: Megaphone, title: "Community Distribution", href: "/app/intros/new" },
  { icon: Rocket, title: "Token Launch Support", href: "/build" },
  { icon: Users, title: "Talent Matching", href: "/builders" },
  { icon: Target, title: "Product Strategy", href: "/build" },
  { icon: Code2, title: "Developer Ecosystem Growth", href: "/app/apply/builder-program" },
];

export function ServicesSection() {
  return (
    <section className="py-24 border-y border-border/50 bg-muted/20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">
            What we provide
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Services
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Venture studio support, capital readiness, ecosystem access, and more. Historically and now.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={s.href}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/80 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/20 transition-colors">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{s.title}</h3>
                    <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Explore <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400 font-medium text-sm transition-all"
          >
            See all services <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
