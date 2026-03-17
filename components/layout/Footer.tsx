"use client";

import Link from "next/link";
import Image from "next/image";
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
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_55%)]" />
            </div>
            <div className="container mx-auto px-6 py-16 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1.85fr] gap-12">
                    <div>
                        <Link href="/" className="flex items-center gap-3 mb-4">
                            <Image
                                src="/logo/webcoinlogo.webp"
                                alt="Webcoin Labs"
                                width={44}
                                height={44}
                                className="rounded-lg"
                            />
                            <span className="font-semibold text-lg tracking-tight">Webcoin Labs</span>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                            Builder ecosystem helping founders launch, fund, and grow blockchain projects.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 rounded-2xl border border-border/60 bg-card/40 p-5">
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
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/70 bg-card hover:bg-accent text-foreground text-sm font-medium transition-colors"
                    >
                        <Calendar className="w-4 h-4" /> Book a Call
                    </button>
                </div>
            </div>
        </footer>
    );
}
