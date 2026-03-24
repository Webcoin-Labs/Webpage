import type { Metadata } from "next";
import { db } from "@/server/db/client";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { NetworkTabs } from "@/components/partners/NetworkTabs";

export const metadata: Metadata = {
    title: "Network — Partners, VCs, CEXs, Launchpads",
    description:
        "Webcoin Labs network: VCs, CEX partners, launchpads, guilds, and media — Current and Legacy (2021–2023).",
};

async function getPartners() {
    return db.partner.findMany({ orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { name: "asc" }] });
}

export default async function NetworkPage() {
    const partners = await getPartners();
    const current = partners.filter((p) => p.status === "CURRENT");
    const legacy = partners.filter((p) => p.status === "LEGACY");

    return (
        <div className="min-h-screen pt-24">
            <section className="py-20 container mx-auto px-6">
                <AnimatedSection className="text-center mb-16">
                    <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-4">Network</p>
                    <h1 className="text-5xl font-bold tracking-tight mb-4">
                        Our <span className="gradient-text">Partner Network</span>
                    </h1>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Current partners are active now. Legacy 2021–2023: past ecosystem and launchpad connections.
                    </p>
                </AnimatedSection>

                <NetworkTabs currentPartners={current} legacyPartners={legacy} />
            </section>
        </div>
    );
}
