import Link from "next/link";
import { Bell, Command, Plus, Search, LayoutGrid, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OsModule } from "@/lib/os/modules";

type Props = {
  title: string;
  subtitle: string;
  rootHref: string;
  modules: OsModule[];
  activeSlug?: string;
  visualVariant?: "default" | "founder-bios";
  integrationConnectedCount?: number;
  integrationTotalCount?: number;
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
};

export function OsWorkspaceShell({
  title,
  subtitle,
  rootHref,
  modules,
  activeSlug,
  visualVariant = "default",
  integrationConnectedCount = 0,
  integrationTotalCount = 0,
  children,
  rightPanel,
}: Props) {
  const isFounderBios = visualVariant === "founder-bios";
  const activeModule = activeSlug ? modules.find((m) => m.slug === activeSlug) : null;
  const syncHealthy = integrationTotalCount > 0 && integrationConnectedCount > 0;
  const syncLabel =
    integrationTotalCount <= 0
      ? "No integrations configured"
      : `${integrationConnectedCount}/${integrationTotalCount} integrations connected`;

  return (
    <div className="flex flex-col gap-0 py-4">
      {/* ── Header Row ── */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-1 pb-4"
        style={{ borderBottom: "0.5px solid #1a1a1e" }}
      >
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.2em]"
            style={{ color: isFounderBios ? "#c4b5fd" : "#6ee7b7" }}
          >
            {isFounderBios ? "Webcoin Labs Workspace" : "Webcoin Labs Workspace"}
          </p>
          <h1 className="mt-[3px] text-[18px] font-semibold" style={{ color: "#e4e4e7", letterSpacing: "-0.3px" }}>
            {title}
            {activeModule ? (
              <span style={{ color: "#a78bfa" }}> · {activeModule.title}</span>
            ) : null}
          </h1>
          <p className="mt-[2px] text-[11px]" style={{ color: "#52525b" }}>
            {activeModule?.description ?? subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px]"
            style={{
              border: "0.5px solid #1e1e24",
              backgroundColor: "#111114",
              color: syncHealthy ? "#34d399" : "#f59e0b",
            }}
          >
            {syncHealthy ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {syncLabel}
          </div>
          <Link
            href={`${rootHref}/integrations`}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] transition-colors"
            style={{ border: "0.5px solid #1e1e24", backgroundColor: "#111114", color: "#71717a" }}
          >
            <Bell className="h-3 w-3" />
            Integrations
          </Link>
          <button
            type="button"
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] transition-colors"
            style={{ border: "0.5px solid #1e1e24", backgroundColor: "#111114", color: "#71717a" }}
          >
            <Command className="h-3 w-3" />
            Command
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors"
            style={{ border: "0.5px solid #4c1d95", backgroundColor: "#1a1040", color: "#a78bfa" }}
          >
            <Plus className="h-3 w-3" />
            Quick Create
          </button>
        </div>
      </div>

      {/* ── Search row ── */}
      <div
        className="flex items-center gap-2 px-1 py-3"
        style={{ borderBottom: "0.5px solid #1a1a1e" }}
      >
        <div
          className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2"
          style={{ border: "0.5px solid #1e1e24", backgroundColor: "#111114" }}
        >
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "#52525b" }} />
          <input
            type="text"
            placeholder="Search apps, people, ventures, tasks..."
            className="w-full bg-transparent text-[12px] outline-none"
            style={{ color: "#d4d4d8" }}
          />
        </div>
      </div>

      {/* ── Single-row scrollable tab bar ── */}
      <nav
        className="overflow-x-auto px-1 pt-3 pb-1"
        style={{ borderBottom: "0.5px solid #1a1a1e", scrollbarWidth: "none" }}
      >
        <div className="flex gap-[2px]" style={{ whiteSpace: "nowrap" }}>
          <Link
            href={rootHref}
            className="rounded-md px-3 py-1 text-[10px] font-medium whitespace-nowrap transition-colors duration-150"
            style={{
              backgroundColor: !activeSlug ? "#1a1030" : "transparent",
              color: !activeSlug ? "#a78bfa" : "#52525b",
              boxShadow: !activeSlug ? "inset 0 -2px 0 #7c3aed" : "none",
            }}
          >
            Dashboard
          </Link>
          {modules.map((mod) => {
            const isActive = activeSlug === mod.slug;
            return (
              <Link
                key={mod.slug}
                href={`${rootHref}/${mod.slug}`}
                className="rounded-md px-3 py-1 text-[10px] font-medium whitespace-nowrap transition-colors duration-150"
                style={{
                  backgroundColor: isActive ? "#1a1030" : "transparent",
                  color: isActive ? "#a78bfa" : "#52525b",
                  boxShadow: isActive ? "inset 0 -2px 0 #7c3aed" : "none",
                }}
              >
                {mod.title}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Content ── */}
      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">{children}</div>
        {rightPanel ? (
          <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">{rightPanel}</aside>
        ) : (
          <aside className="hidden xl:block" />
        )}
      </div>
    </div>
  );
}

export function OsLauncherGrid({
  rootHref,
  modules,
  visualVariant = "default",
}: {
  rootHref: string;
  modules: OsModule[];
  visualVariant?: "default" | "founder-bios";
}) {
  const isFounderBios = visualVariant === "founder-bios";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((module) => {
        const Icon = module.icon;
        return (
          <Link
            key={module.slug}
            href={`${rootHref}/${module.slug}`}
            className={cn(
              "rounded-xl border border-border/60 bg-card p-4 transition-all duration-200",
              isFounderBios
                ? "hover:-translate-y-0.5 hover:border-[#4c1d95] hover:bg-zinc-900/60"
                : "hover:border-cyan-500/30 hover:bg-accent/20",
            )}
          >
            <div
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-lg border",
                isFounderBios
                  ? "border-[#3b1d8a] bg-[#1a1040] text-[#a78bfa]"
                  : "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-sm font-semibold">{module.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{module.description}</p>
          </Link>
        );
      })}
    </div>
  );
}
