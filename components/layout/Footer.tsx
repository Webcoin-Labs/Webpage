"use client";

import Link from "next/link";
import { Github, Twitter, Calendar } from "lucide-react";
import { useCalendly } from "@/components/providers/CalendlyProvider";

const footerLinks = {
    Products: [
        { label: "Products", href: "/products" },
        { label: "Services", href: "/services" },
        { label: "Network", href: "/network" },
        { label: "Pitch Deck", href: "/pitchdeck" },
    ],
    Directory: [
        { label: "Builders", href: "/builders" },
        { label: "Projects", href: "/projects" },
    ],
    Resources: [
        { label: "Insights", href: "/insights" },
        { label: "Webcoin Labs 2.0", href: "/webcoin-labs-2-0" },
        { label: "Contact", href: "/contact" },
    ],
    Portal: [
        { label: "Launch App", href: "/app" },
        { label: "Apply — Builder", href: "/app/apply/builder-program" },
        { label: "Apply — Founder", href: "/app/apply/founder-support" },
    ],
};

export function Footer() {
    const openCalendly = useCalendly();

    return (
        <footer className="relative border-t border-border/50 bg-background overflow-hidden">
            {/* Optional subtle watermark */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: "url(/brand/watermark.svg)",
                backgroundRepeat: "repeat",
                backgroundSize: "100px 40px",
              }}
            />
            <div className="container mx-auto px-6 py-16 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                                W
                            </div>
                            <span className="font-bold text-lg">
                                Webcoin <span className="gradient-text">Labs</span>
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                            Builder-first innovation hub and venture studio. Formerly Webcoin Capital.
                            Rebuilt for the new era.
                        </p>
                        <div className="flex items-center gap-3 mt-6">
                            <a
                                href="https://twitter.com/webcoinlabs"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            >
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a
                                href="https://github.com/webcoinlabs"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            >
                                <Github className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    {Object.entries(footerLinks).map(([group, links]) => (
                        <div key={group}>
                            <h3 className="text-sm font-semibold mb-4">{group}</h3>
                            <ul className="space-y-2.5">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-16 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                        © 2026 Webcoin Labs. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={openCalendly}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400 text-sm font-medium transition-colors"
                        >
                            <Calendar className="w-4 h-4" /> Book Demo
                        </button>
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            Webcoin Labs 2.0 — Live
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
