"use client";

import Link from "next/link";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import type { Partner } from "@prisma/client";

export function NetworkStrip({ partners }: { partners: Partner[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
      {partners.map((partner, i) => (
        <AnimatedSection key={partner.id} delay={i * 0.03}>
          <Link
            href={partner.url ?? "/network"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-24 h-12 md:w-28 md:h-14 grayscale hover:grayscale-0 opacity-80 hover:opacity-100 transition-all"
          >
            {partner.logoPath ? (
              <img
                src={partner.logoPath}
                alt={partner.name}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="text-lg font-bold text-muted-foreground">{partner.name.charAt(0)}</span>
            )}
          </Link>
        </AnimatedSection>
      ))}
    </div>
  );
}
