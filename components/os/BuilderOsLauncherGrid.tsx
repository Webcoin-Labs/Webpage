"use client";

import Link from "next/link";
import {
  Briefcase,
  ChevronRight,
  FileBadge2,
  FileText,
  FolderKanban,
  GitBranch,
  Inbox,
  Network,
  NotebookPen,
  Rss,
  Workflow,
  Wrench,
} from "lucide-react";
import { builderModules } from "@/lib/os/modules";

const iconColors: Record<string, { bg: string; color: string; ghostColor: string }> = {
  "ecosystem-feed": { bg: "#071b1d", color: "#67e8f9", ghostColor: "rgba(103,232,249,0.06)" },
  "proof-profile": { bg: "#071b1d", color: "#67e8f9", ghostColor: "rgba(103,232,249,0.06)" },
  projects: { bg: "#0b1323", color: "#60a5fa", ghostColor: "rgba(96,165,250,0.06)" },
  github: { bg: "#10141f", color: "#c4b5fd", ghostColor: "rgba(196,181,253,0.06)" },
  opportunities: { bg: "#10141f", color: "#a78bfa", ghostColor: "rgba(167,139,250,0.06)" },
  "resume-lab": { bg: "#102014", color: "#4ade80", ghostColor: "rgba(74,222,128,0.06)" },
  "cover-letters": { bg: "#1b1606", color: "#fbbf24", ghostColor: "rgba(251,191,36,0.06)" },
  "work-log": { bg: "#0b1323", color: "#60a5fa", ghostColor: "rgba(96,165,250,0.06)" },
  references: { bg: "#102014", color: "#4ade80", ghostColor: "rgba(74,222,128,0.06)" },
  integrations: { bg: "#071b1d", color: "#67e8f9", ghostColor: "rgba(103,232,249,0.06)" },
};

const launcherIcons: Record<string, typeof Briefcase> = {
  "ecosystem-feed": Rss,
  "proof-profile": FileBadge2,
  projects: FolderKanban,
  github: GitBranch,
  opportunities: Inbox,
  "resume-lab": NotebookPen,
  "cover-letters": FileText,
  "work-log": Briefcase,
  references: Network,
  integrations: Workflow,
};

export function BuilderOsLauncherGrid({
  rootHref,
}: {
  rootHref: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-cyan-300/70">
            Builder app launcher
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open proof-of-work spaces for portfolio, opportunities, resume assets, and execution history.
          </p>
        </div>
        <div className="hidden rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-medium text-cyan-200 lg:block">
          Portfolio-first workflow
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {builderModules.map((mod) => {
          const Icon = launcherIcons[mod.slug] ?? Wrench;
          const colors = iconColors[mod.slug] ?? {
            bg: "#071b1d",
            color: "#67e8f9",
            ghostColor: "rgba(103,232,249,0.06)",
          };

          return (
            <Link
              key={mod.slug}
              href={`${rootHref}/${mod.slug}`}
              className="group relative overflow-hidden rounded-[14px] border border-border/60 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-500/30 hover:bg-[#101419]"
            >
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(circle at top right, rgba(34,211,238,0.08) 0%, transparent 58%)",
                }}
              />

              <div className="absolute -right-3 -bottom-3 pointer-events-none">
                <Icon
                  className="h-[76px] w-[76px]"
                  style={{ color: colors.ghostColor }}
                  strokeWidth={0.8}
                />
              </div>

              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                }}
              />

              <div className="relative z-10 flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border"
                  style={{ backgroundColor: colors.bg, borderColor: "rgba(34,211,238,0.12)" }}
                >
                  <Icon className="h-4 w-4" style={{ color: colors.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{mod.title}</p>
                      <p className="mt-1 max-w-[26ch] text-xs leading-5 text-muted-foreground">
                        {mod.description}
                      </p>
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-cyan-300" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
