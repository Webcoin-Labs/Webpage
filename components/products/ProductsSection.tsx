"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  User,
  Search,
  Users,
  Handshake,
  Coins,
  Share2,
  ArrowRight,
} from "lucide-react";

const products = [
  { icon: User, title: "Builder Identity", href: "/app/profile", desc: "Verified profiles for builders and founders." },
  { icon: Search, title: "Project Discovery", href: "/projects", desc: "Public directories for projects and talent." },
  { icon: Users, title: "Startup Network", href: "/builders", desc: "Connect with builders and founders." },
  { icon: Handshake, title: "Ecosystem Introductions", href: "/app/intros/new", desc: "Request intros to partners and investors." },
  { icon: Coins, title: "Stablecoin Infrastructure", href: "/build", desc: "Fintech and stablecoin support." },
  { icon: Share2, title: "Distribution Network", href: "/network", desc: "Access to launchpads, CEXs, and media." },
];

export function ProductsSection() {
  return (
    <section className="py-24 border-y border-border/50 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">
            Platform
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Products built by Webcoin Labs
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Builder infrastructure for blockchain and stablecoin startups.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {products.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  href={p.href}
                  className="group block h-full p-6 rounded-2xl border border-border/50 bg-card/80 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/5 hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition-colors">
                    <Icon className="w-6 h-6 text-violet-400" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{p.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-400 group-hover:gap-2 transition-all">
                    Learn more <ArrowRight className="w-3.5 h-3.5" />
                  </span>
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
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-violet-500/30 hover:bg-violet-500/10 text-violet-400 font-medium text-sm transition-all"
          >
            See all products <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
