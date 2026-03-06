"use client";

import Link from "next/link";
import type { Partner } from "@prisma/client";
import { ChevronRight } from "lucide-react";

export function PartnerMarquee({ partners }: { partners: Partner[] }) {
  // Only show partners that actually have a logoPath (avoid broken / text-only tiles)
  const withLogos = partners.filter((p) => p.logoPath);
  if (withLogos.length === 0) return null;

  // Duplicate for seamless infinite scroll
  const duplicated = [...withLogos, ...withLogos];

  return (
    <section className="relative py-20 overflow-hidden border-y border-border/50 bg-gradient-to-b from-background via-background/95 to-background">
      {/* Watermark background */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `url(/brand/watermark.svg)`,
          backgroundRepeat: "repeat",
          backgroundSize: "140px 56px",
        }}
      />
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
            Trusted by / Our Network
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Curated partners and ecosystem relationships (2021–2023 legacy + ongoing).
          </p>
        </div>

        {/* Marquee: horizontal scroll, pause on hover, infinite */}
        <div className="relative">
          <div className="overflow-hidden py-4">
            <div className="flex gap-12 w-max partner-marquee-track">
              {duplicated.map((partner, i) => (
                <div
                  key={`${partner.id}-${i}`}
                  className="flex-shrink-0 flex flex-col items-center justify-center"
                >
                  <div className="flex items-center justify-center h-16 md:h-20 px-6 md:px-8 grayscale hover:grayscale-0 opacity-80 hover:opacity-100 transition-all">
                    <img
                      src={partner.logoPath!}
                      alt={partner.name}
                      className="max-h-10 md:max-h-12 w-auto object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/network"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View full network <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
