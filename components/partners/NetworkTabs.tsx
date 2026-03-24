"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type { Partner } from "@prisma/client";

const PartnerGrid = dynamic(
  () => import("@/components/partners/PartnerGrid").then((mod) => mod.PartnerGrid),
  {
    loading: () => <div className="h-48 animate-pulse rounded-2xl border border-border/50 bg-card/60" />,
  },
);

export function NetworkTabs({
  currentPartners,
  legacyPartners,
}: { currentPartners: Partner[]; legacyPartners: Partner[] }) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"current" | "legacy">("current");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "legacy") setTab("legacy");
    else if (t === "current") setTab("current");
  }, [searchParams]);

  return (
    <div>
      <div className="flex gap-2 mb-10 justify-center">
        <button
          type="button"
          onClick={() => setTab("current")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition-all ${
            tab === "current"
              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
              : "border-border text-muted-foreground hover:border-cyan-500/40 hover:text-foreground"
          }`}
        >
          Current Network
        </button>
        <button
          type="button"
          onClick={() => setTab("legacy")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition-all ${
            tab === "legacy"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : "border-border text-muted-foreground hover:border-amber-500/40 hover:text-foreground"
          }`}
        >
          Legacy (2021–2023)
        </button>
      </div>

      {tab === "current" && (
        <div>
          <p className="text-sm text-muted-foreground text-center mb-6">Curated partners. Logos from /network/current.</p>
          <PartnerGrid partners={currentPartners} />
        </div>
      )}
      {tab === "legacy" && (
        <div>
          <p className="text-sm text-muted-foreground text-center mb-6">Past ecosystem and launchpad partners. Logos from /network/legacy.</p>
          <PartnerGrid partners={legacyPartners} />
        </div>
      )}
    </div>
  );
}
