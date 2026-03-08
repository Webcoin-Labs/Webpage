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
    <section className="py-24 bg-muted/30 border-b border-border">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-border bg-background text-muted-foreground text-xs font-medium mb-6">
            What we provide
          </div>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
            Services
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Venture studio support, capital readiness, ecosystem access, and growth engineering.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm hover:bg-accent/50 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{s.title}</h3>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/50 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border bg-background hover:bg-accent text-foreground font-medium text-sm shadow-sm transition-all"
          >
            See all services <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
