"use client";

import { useState } from "react";
import { AnimatedSection } from "@/components/common/AnimatedSection";

interface Partner {
    id: string;
    name: string;
    logoPath: string | null;
    category: string;
    status: string;
    url: string | null;
}

const CATEGORIES = ["ALL", "VC", "CEX", "LAUNCHPAD", "GUILD", "MEDIA", "PORTFOLIO"];

const categoryLabel: Record<string, string> = {
    ALL: "All",
    VC: "VCs",
    CEX: "Exchanges",
    LAUNCHPAD: "Launchpads",
    GUILD: "Guilds",
    MEDIA: "Media",
    PORTFOLIO: "Portfolio",
};

export function PartnerGrid({ partners }: { partners: Partner[] }) {
    const [activeFilter, setActiveFilter] = useState("ALL");

    const filtered =
        activeFilter === "ALL"
            ? partners
            : partners.filter((p) => p.category === activeFilter);

    return (
        <div>
            {/* Filter chips */}
            <div className="flex flex-wrap gap-2 mb-10 justify-center">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveFilter(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${activeFilter === cat
                                ? "bg-cyan-500 text-white border-cyan-500"
                                : "border-border text-muted-foreground hover:border-cyan-500/40 hover:text-foreground"
                            }`}
                    >
                        {categoryLabel[cat]}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.map((partner, i) => (
                    <AnimatedSection key={partner.id} delay={i * 0.03}>
                        <a
                            href={partner.url ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative flex flex-col items-center gap-3 p-5 rounded-xl border border-border/50 bg-card hover:border-cyan-500/30 hover:bg-accent/30 transition-all text-center"
                        >
                            {/* Logo/Initial */}
                            {partner.logoPath ? (
                                <img src={partner.logoPath} alt={partner.name} className="w-12 h-12 rounded-lg object-contain bg-muted/50" />
                            ) : (
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-lg font-bold text-muted-foreground group-hover:from-cyan-500/10 group-hover:to-violet-500/10 transition-all">
                                    {partner.name.charAt(0)}
                                </div>
                            )}
                            <span className="text-xs font-medium leading-tight">{partner.name}</span>

                            {/* Status badge */}
                            {partner.status === "LEGACY" ? (
                                <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    Legacy
                                </span>
                            ) : (
                                <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    Current
                                </span>
                            )}
                        </a>
                    </AnimatedSection>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                    No partners in this category yet.
                </div>
            )}
        </div>
    );
}
