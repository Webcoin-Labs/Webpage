"use client";

import Link from "next/link";
import {
  BarChart2,
  Calendar,
  ChevronRight,
  CircleDollarSign,
  Command,
  FileText,
  FolderLock,
  Layers,
  MessageSquare,
  Plug,
  Rss,
  Search,
  Shield,
  Terminal,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { founderModules } from "@/lib/os/modules";

/* ─── Icon color families ─── */
const iconColors: Record<string, { bg: string; color: string; ghostColor: string }> = {
  "command-center": { bg: "#1a1040", color: "#a78bfa", ghostColor: "rgba(167,139,250,0.06)" },
  "ecosystem-feed": { bg: "#0a201a", color: "#34d399", ghostColor: "rgba(52,211,153,0.06)" },
  "ventures": { bg: "#0a201a", color: "#34d399", ghostColor: "rgba(52,211,153,0.06)" },
  "launch-readiness": { bg: "#051020", color: "#60a5fa", ghostColor: "rgba(96,165,250,0.06)" },
  "builder-discovery": { bg: "#0a201a", color: "#34d399", ghostColor: "rgba(52,211,153,0.06)" },
  "investor-connect": { bg: "#1a1040", color: "#a78bfa", ghostColor: "rgba(167,139,250,0.06)" },
  "advisor-connect": { bg: "#1a1040", color: "#a78bfa", ghostColor: "rgba(167,139,250,0.06)" },
  "data-room": { bg: "#1a1200", color: "#fbbf24", ghostColor: "rgba(251,191,36,0.06)" },
  "pitch-deck": { bg: "#1a1200", color: "#fbbf24", ghostColor: "rgba(251,191,36,0.06)" },
  "raise-round": { bg: "#051020", color: "#60a5fa", ghostColor: "rgba(96,165,250,0.06)" },
  "tokenomics": { bg: "#1a1040", color: "#a78bfa", ghostColor: "rgba(167,139,250,0.06)" },
  "meetings": { bg: "#051020", color: "#60a5fa", ghostColor: "rgba(96,165,250,0.06)" },
  "market-intelligence": { bg: "#1a1200", color: "#fbbf24", ghostColor: "rgba(251,191,36,0.06)" },
  "communications": { bg: "#0a201a", color: "#34d399", ghostColor: "rgba(52,211,153,0.06)" },
  "integrations": { bg: "#051020", color: "#60a5fa", ghostColor: "rgba(96,165,250,0.06)" },
};

const launcherIcons: Record<string, typeof Terminal> = {
  "command-center": Terminal,
  "ecosystem-feed": Rss,
  "ventures": Layers,
  "launch-readiness": Shield,
  "builder-discovery": Search,
  "investor-connect": Users,
  "advisor-connect": UserCheck,
  "data-room": FolderLock,
  "pitch-deck": FileText,
  "raise-round": TrendingUp,
  "tokenomics": CircleDollarSign,
  "meetings": Calendar,
  "market-intelligence": BarChart2,
  "communications": MessageSquare,
  "integrations": Plug,
};

export function FounderOsLauncherGrid({
  rootHref,
}: {
  rootHref: string;
}) {
  return (
    <section>
      <p
        className="mb-2 text-[9px] font-bold uppercase"
        style={{ color: "#3f3f46", letterSpacing: "0.1em" }}
      >
        App launcher — open dedicated workspaces
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {founderModules.map((mod) => {
          const Icon = launcherIcons[mod.slug] ?? Command;
          const colors = iconColors[mod.slug] ?? { bg: "#1a1040", color: "#a78bfa", ghostColor: "rgba(167,139,250,0.06)" };

          return (
            <Link
              key={mod.slug}
              href={`${rootHref}/${mod.slug}`}
              className="group relative flex items-center gap-[10px] overflow-hidden rounded-[9px] p-[13px_12px] transition-all duration-200 hover:border-[#4c1d95] hover:bg-[#12101e]"
              style={{
                backgroundColor: "#111114",
                border: "0.5px solid #1e1e24",
              }}
            >
              {/* Large ghost icon in background */}
              <div className="absolute -right-3 -bottom-3 pointer-events-none">
                <Icon
                  className="h-[80px] w-[80px]"
                  style={{ color: colors.ghostColor }}
                  strokeWidth={0.8}
                />
              </div>

              {/* Subtle grid pattern overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
                  `,
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Content */}
              <div className="relative z-10 flex items-center gap-[10px] w-full">
                <div
                  className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px]"
                  style={{ backgroundColor: colors.bg }}
                >
                  <Icon className="h-[14px] w-[14px]" style={{ color: colors.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold" style={{ color: "#d4d4d8" }}>{mod.title}</p>
                  <p className="text-[9px] leading-[1.4]" style={{ color: "#52525b" }}>{mod.description}</p>
                </div>
                <ChevronRight className="h-[10px] w-[10px] shrink-0" style={{ color: "#3f3f46" }} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
