import Link from "next/link";
import { Bell, Command, Plus, Search, Wifi, WifiOff } from "lucide-react";
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

function LauncherLink({
  href,
  label,
  icon: Icon,
  active,
  visualVariant = "default",
}: {
  href: string;
  label: string;
  icon: OsModule["icon"];
  active?: boolean;
  visualVariant?: "default" | "founder-bios";
}) {
  const isFounderBios = visualVariant === "founder-bios";
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors duration-200",
        active
          ? isFounderBios
            ? "border-orange-500/40 bg-orange-500/10 text-orange-200"
            : "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
          : isFounderBios
            ? "border-border/60 bg-background text-muted-foreground hover:border-orange-500/30 hover:text-foreground"
            : "border-border/60 bg-card text-muted-foreground hover:border-cyan-500/30 hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className={cn(isFounderBios ? "uppercase tracking-[0.08em]" : "")}>{label}</span>
    </Link>
  );
}

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
  const activeModule = activeSlug ? modules.find((module) => module.slug === activeSlug) : null;
  const syncHealthy = integrationTotalCount > 0 && integrationConnectedCount > 0;
  const syncLabel =
    integrationTotalCount <= 0
      ? "No integrations configured"
      : `${integrationConnectedCount}/${integrationTotalCount} integrations connected`;

  return (
    <div className="space-y-4 py-6">
      <section
        className={cn(
          "rounded-2xl border border-border/60 p-4 shadow-sm backdrop-blur",
          isFounderBios ? "bg-card" : "bg-card/80",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={cn("text-[11px] uppercase tracking-[0.18em]", isFounderBios ? "text-orange-300/90" : "text-cyan-300")}>
              {isFounderBios ? "// Founder Command Desk" : "Webcoin Labs Workspace"}
            </p>
            <h1 className={cn("mt-1", isFounderBios ? "text-2xl font-black uppercase tracking-tight md:text-3xl" : "text-xl font-semibold")}>
              {title}
              {activeModule ? ` · ${activeModule.title}` : ""}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">{activeModule?.description ?? subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground",
                isFounderBios ? "hover:border-orange-500/30 hover:text-foreground" : "",
              )}
            >
              <Command className="h-3.5 w-3.5" />
              Command
            </button>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs",
                isFounderBios
                  ? "border border-orange-500/30 bg-orange-500/10 text-orange-200"
                  : "border border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Quick Create
            </button>
          </div>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
          <label className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
            <input
              type="text"
              placeholder="Search apps, people, ventures, tasks..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
            />
          </label>
          <div className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground">
            {syncHealthy ? <Wifi className="h-3.5 w-3.5 text-emerald-300" /> : <WifiOff className="h-3.5 w-3.5 text-amber-300" />}
            {syncLabel}
          </div>
          <Link
            href={`${rootHref}/integrations`}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground hover:text-foreground",
              isFounderBios ? "hover:border-orange-500/30" : "",
            )}
          >
            <Bell className="h-3.5 w-3.5" />
            Integrations
          </Link>
        </div>
      </section>

      <section
        className={cn(
          "sticky top-2 z-10 rounded-2xl border border-border/60 p-3 shadow-sm backdrop-blur",
          isFounderBios ? "bg-card" : "bg-card/85",
        )}
      >
        <div className="flex flex-wrap gap-2">
          <LauncherLink href={rootHref} label="Dashboard" icon={Search} active={!activeSlug} visualVariant={visualVariant} />
          {modules.map((module) => (
            <LauncherLink
              key={module.slug}
              href={`${rootHref}/${module.slug}`}
              label={module.title}
              icon={module.icon}
              active={activeSlug === module.slug}
              visualVariant={visualVariant}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">{children}</div>
        {rightPanel ? (
          <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">{rightPanel}</aside>
        ) : (
          <aside className="hidden xl:block" />
        )}
      </section>
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
                ? "hover:-translate-y-0.5 hover:border-orange-500/30 hover:bg-zinc-900/60"
                : "hover:border-cyan-500/30 hover:bg-accent/20",
            )}
          >
            <div
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-lg border",
                isFounderBios
                  ? "border-orange-500/20 bg-orange-500/10 text-orange-300"
                  : "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <p className={cn("mt-3 text-sm font-semibold", isFounderBios ? "uppercase tracking-[0.08em]" : "")}>{module.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{module.description}</p>
          </Link>
        );
      })}
    </div>
  );
}

