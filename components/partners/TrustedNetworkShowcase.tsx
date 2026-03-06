"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import type { Partner } from "@prisma/client";
import { ChevronRight } from "lucide-react";

const CATEGORIES = [
  { id: "ALL", label: "All" },
  { id: "VC", label: "VC" },
  { id: "LAUNCHPAD", label: "Launchpads" },
  { id: "CEX", label: "Exchanges" },
  { id: "GUILD", label: "Guilds" },
  { id: "MEDIA", label: "Media" },
  { id: "PORTFOLIO", label: "Portfolio" },
] as const;

export function TrustedNetworkShowcase({ partners }: { partners: Partner[] }) {
  const [filter, setFilter] = useState<string>("ALL");
  const filtered =
    filter === "ALL"
      ? partners
      : partners.filter((p) => p.category === filter);

  return (
    <section className="py-20 border-y border-border/50 bg-muted/20">
      <div className="container mx-auto px-6">
        <AnimatedSection className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
            Trusted Network
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Curated partners and ecosystem relationships (2021–2023 legacy + ongoing).
          </p>
        </AnimatedSection>

        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilter(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                filter === cat.id
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-cyan-500/30"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 max-w-5xl mx-auto">
          {filtered.slice(0, 24).map((partner, i) => (
            <AnimatedSection key={partner.id} delay={i * 0.02}>
              <Link
                href={partner.url ?? "/network"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/60 bg-card/80 hover:border-cyan-500/40 hover:bg-card transition-all grayscale hover:grayscale-0 opacity-90 hover:opacity-100 h-24 md:h-28"
              >
                {partner.logoPath ? (
                  <img
                    src={partner.logoPath}
                    alt={partner.name}
                    className="max-w-full max-h-12 md:max-h-14 w-auto object-contain"
                  />
                ) : (
                  <span className="text-xl font-bold text-foreground/80">
                    {partner.name.charAt(0)}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center">
                  {partner.name}
                </span>
              </Link>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection className="text-center mt-10">
          <Link
            href="/network"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View full network <ChevronRight className="w-4 h-4" />
          </Link>
        </AnimatedSection>
      </div>
    </section>
  );
}
