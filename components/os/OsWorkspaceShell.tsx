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
}: {
  href: string;
  label: string;
  icon: OsModule["icon"];
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition",
        active
          ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
          : "border-border/60 bg-card text-muted-foreground hover:border-cyan-500/30 hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

export function OsWorkspaceShell({
  title,
  subtitle,
  rootHref,
  modules,
  activeSlug,
  integrationConnectedCount = 0,
  integrationTotalCount = 0,
  children,
  rightPanel,
}: Props) {
  const activeModule = activeSlug ? modules.find((module) => module.slug === activeSlug) : null;
  const syncHealthy = integrationTotalCount > 0 && integrationConnectedCount > 0;
  const syncLabel =
    integrationTotalCount <= 0
      ? "No integrations configured"
      : `${integrationConnectedCount}/${integrationTotalCount} integrations connected`;

  return (
    <div className="space-y-4 py-6">
      <section className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300">Webcoin Labs Workspace</p>
            <h1 className="mt-1 text-xl font-semibold">
              {title}
              {activeModule ? ` · ${activeModule.title}` : ""}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">{activeModule?.description ?? subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground"
            >
              <Command className="h-3.5 w-3.5" />
              Command
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200"
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
            className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Bell className="h-3.5 w-3.5" />
            Integrations
          </Link>
        </div>
      </section>

      <section className="sticky top-2 z-10 rounded-2xl border border-border/60 bg-card/85 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap gap-2">
          <LauncherLink href={rootHref} label="Dashboard" icon={Search} active={!activeSlug} />
          {modules.map((module) => (
            <LauncherLink
              key={module.slug}
              href={`${rootHref}/${module.slug}`}
              label={module.title}
              icon={module.icon}
              active={activeSlug === module.slug}
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
}: {
  rootHref: string;
  modules: OsModule[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((module) => {
        const Icon = module.icon;
        return (
          <Link
            key={module.slug}
            href={`${rootHref}/${module.slug}`}
            className="rounded-xl border border-border/60 bg-card p-4 transition hover:border-cyan-500/30 hover:bg-accent/20"
          >
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
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

