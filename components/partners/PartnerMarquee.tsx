"use client";

import { useState } from "react";
import Link from "next/link";
import type { Partner } from "@prisma/client";
import { ChevronRight } from "lucide-react";

export function PartnerMarquee({ partners }: { partners: Partner[] }) {
  // Only show partners that actually have a logoPath (avoid broken / text-only tiles)
  const withLogos = partners.filter((p) => p.logoPath);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  const markFailed = (url: string) => {
    setFailedUrls((prev) => new Set(prev).add(url));
  };

  const visiblePartners = withLogos.filter((p) => !failedUrls.has(p.logoPath!));
  if (visiblePartners.length === 0) return null;

  // Duplicate for seamless infinite scroll
  const duplicated = [...visiblePartners, ...visiblePartners];

  return (
    <section className="relative py-16 overflow-hidden bg-background border-y border-border">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-10">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Trusted by the blockchain ecosystem
          </p>
        </div>

        {/* Marquee: horizontal scroll, pause on hover, infinite */}
        <div className="relative">
          <div className="overflow-hidden py-4">
            <div className="flex gap-16 w-max partner-marquee-track items-center">
              {duplicated.map((partner, i) => (
                <div
                  key={`${partner.id}-${i}`}
                  className="flex-shrink-0 flex items-center justify-center"
                >
                  <img
                    src={partner.logoPath!}
                    alt={partner.name}
                    className="max-h-8 md:max-h-10 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all"
                    onError={() => markFailed(partner.logoPath!)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/network"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View full ecosystem <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
