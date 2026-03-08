"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";
import { useCalendly } from "@/components/providers/CalendlyProvider";

const footerLinks = [
    { label: "Products", href: "/products" },
    { label: "Services", href: "/services" },
    { label: "Builders", href: "/builders" },
    { label: "Projects", href: "/projects" },
    { label: "Insights", href: "/insights" },
    { label: "Pitch Deck", href: "/pitchdeck" },
];

export function Footer() {
    const openCalendly = useCalendly();

    return (
        <footer className="relative border-t border-border/50 bg-background overflow-hidden">
            <div className="container mx-auto px-6 py-14 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.8fr] gap-12">
                    <div>
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                W
                            </div>
                            <span className="font-semibold text-lg">Webcoin Labs</span>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                            Builder ecosystem helping founders launch, fund, and grow blockchain projects.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        {footerLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="mt-12 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                        (c) 2026 Webcoin Labs. All rights reserved.
                    </p>
                    <button
                        onClick={openCalendly}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-blue-500/30 hover:bg-blue-500/10 text-blue-300 text-sm font-medium transition-colors"
                    >
                        <Calendar className="w-4 h-4" /> Book a Call
                    </button>
                </div>
            </div>
        </footer>
    );
}
