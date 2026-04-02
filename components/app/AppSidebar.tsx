"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import {
  BellRing,
  BookOpen,
  ChevronDown,
  Compass,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LogOut,
  Rocket,
  Search,
  Settings,
  User,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";
import { builderModules, founderModules, investorModules } from "@/lib/os/modules";

interface SidebarUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
}

interface SidebarAffiliation {
  label: string;
  variant: "default" | "founder" | "independent" | "available";
}

type AppWorkspace = "FOUNDER_OS" | "BUILDER_OS" | "INVESTOR_OS";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Array<"BUILDER" | "FOUNDER" | "INVESTOR" | "ADMIN">;
  exact?: boolean;
  workspace?: AppWorkspace;
};

const systemItems: NavItem[] = [
  { href: "/app/ecosystem-feed", label: "Ecosystem Feed", icon: Compass },
  { href: "/app/workspaces", label: "Apps / Launcher", icon: Compass },
  { href: "/app/notifications", label: "Inbox", icon: Inbox },
  { href: "/app/events", label: "Tasks / Activity", icon: BellRing },
  { href: "/app/founders", label: "People / Network", icon: User },
  { href: "/app/docs", label: "Docs", icon: BookOpen },
  { href: "/app/projects", label: "Files / Data Room", icon: FolderKanban, roles: ["FOUNDER", "ADMIN"] },
  { href: "/app/builder-projects", label: "Files / Data Room", icon: FolderKanban, roles: ["BUILDER", "ADMIN"] },
  { href: "/app/settings", label: "Integrations", icon: Wrench },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

const osItems: NavItem[] = [
  { href: "/app/founder-os", label: "Founder OS", icon: Rocket, roles: ["FOUNDER", "ADMIN"], workspace: "FOUNDER_OS" },
  { href: "/app/builder-os", label: "Builder OS", icon: Rocket, roles: ["BUILDER", "ADMIN"], workspace: "BUILDER_OS" },
  { href: "/app/investor-os", label: "Investor OS", icon: Rocket, roles: ["INVESTOR", "ADMIN"], workspace: "INVESTOR_OS" },
];

function canAccessRole(item: NavItem, role: string) {
  if (!item.roles || item.roles.length === 0) return true;
  if (role === "ADMIN") return true;
  return item.roles.includes(role as "BUILDER" | "FOUNDER" | "INVESTOR" | "ADMIN");
}

function canAccessWorkspace(item: NavItem, enabledWorkspaces: AppWorkspace[]) {
  if (!item.workspace) return true;
  return enabledWorkspaces.includes(item.workspace);
}

const founderSidebarModules = founderModules.filter((module) => module.slug !== "ecosystem-feed");
const builderSidebarModules = builderModules.filter((module) => module.slug !== "ecosystem-feed");
const investorSidebarModules = investorModules.filter((module) => module.slug !== "ecosystem-feed");

function NavSection({
  items,
  pathname,
  role,
  enabledWorkspaces,
}: {
  items: NavItem[];
  pathname: string;
  role: string;
  enabledWorkspaces: AppWorkspace[];
}) {
  return (
    <>
      {items
        .filter((item) => canAccessRole(item, role) && canAccessWorkspace(item, enabledWorkspaces))
        .map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-[var(--radius-lg)] px-2.5 py-[7px] text-[12px] font-medium transition-all duration-150 mx-1.5 my-[1px]",
                isActive
                  ? "bg-[var(--bg-active)] text-[var(--text-primary)] border-l-2 border-[var(--accent-color)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] border-l-2 border-transparent",
              )}
            >
              <Icon className="h-[15px] w-[15px] shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
    </>
  );
}

export function AppSidebar({
  user,
  affiliation,
  enabledWorkspaces = [],
}: {
  user: SidebarUser;
  affiliation?: SidebarAffiliation | null;
  enabledWorkspaces?: AppWorkspace[];
}) {
  const pathname = usePathname();
  const founderOsVisible = canAccessRole(osItems[0], user.role) && canAccessWorkspace(osItems[0], enabledWorkspaces);
  const founderOsActive = pathname.startsWith("/app/founder-os");
  const [founderOsExpanded, setFounderOsExpanded] = useState(founderOsActive);
  const builderOsVisible = canAccessRole(osItems[1], user.role) && canAccessWorkspace(osItems[1], enabledWorkspaces);
  const builderOsActive = pathname.startsWith("/app/builder-os");
  const [builderOsExpanded, setBuilderOsExpanded] = useState(builderOsActive);
  const investorOsVisible = canAccessRole(osItems[2], user.role) && canAccessWorkspace(osItems[2], enabledWorkspaces);
  const investorOsActive = pathname.startsWith("/app/investor-os");
  const [investorOsExpanded, setInvestorOsExpanded] = useState(investorOsActive);

  useEffect(() => {
    if (founderOsActive) setFounderOsExpanded(true);
  }, [founderOsActive]);
  useEffect(() => {
    if (builderOsActive) setBuilderOsExpanded(true);
  }, [builderOsActive]);
  useEffect(() => {
    if (investorOsActive) setInvestorOsExpanded(true);
  }, [investorOsActive]);

  return (
    <aside
      className="sticky top-3 left-3 hidden h-[calc(100vh-24px)] w-[246px] shrink-0 flex-col overflow-hidden rounded-[28px] md:flex"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderRight: "0.5px solid var(--border-subtle)",
        border: "0.5px solid var(--border-subtle)",
        marginLeft: "12px",
        marginBottom: "12px",
      }}
    >
      {/* Logo + Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-bold text-white"
          style={{ backgroundColor: "var(--accent-color)" }}
        >
          W
        </div>
        <span className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Webcoin Labs
        </span>
      </div>

      {/* User Card */}
      <div className="mx-3 mb-3 overflow-hidden rounded-[14px] p-3" style={{
        backgroundColor: "var(--bg-elevated)",
        border: "0.5px solid var(--border-subtle)",
      }}>
        <div className="flex items-start gap-3">
          <ProfileAvatar
            src={user.image}
            alt={user.name ?? "User"}
            fallback={user.name?.charAt(0) ?? user.email?.charAt(0) ?? "U"}
            className="h-11 w-11 shrink-0 rounded-xl"
            fallbackClassName="rounded-xl bg-violet-600 text-sm font-bold text-white"
          />
          <div className="min-w-0 flex-1">
            <p
              className="line-clamp-2 break-words text-[13px] font-semibold leading-4"
              style={{ color: "var(--text-primary)" }}
              title={user.name ?? "User"}
            >
              {user.name ?? "User"}
            </p>
            {user.email ? (
              <p
                className="mt-1 truncate text-[11px]"
                style={{ color: "var(--text-muted)" }}
                title={user.email}
              >
                {user.email}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: "var(--accent-dim)",
                  color: "var(--accent-soft)",
                }}
              >
                {user.role}
              </span>
              {affiliation ? <ProfileAffiliationTag label={affiliation.label} variant={affiliation.variant} size="sm" /> : null}
            </div>
          </div>
        </div>
      </div>

      {/* Search Pill */}
      <div className="mx-3 mb-3">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "0.5px solid var(--border-subtle)",
          }}
        >
          <Search className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
          <span className="flex-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
            Search...
          </span>
          <kbd
            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: "var(--bg-hover)",
              color: "var(--text-muted)",
              border: "0.5px solid var(--border-subtle)",
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-2">
        <div>
          <p
            className="mb-1 px-3 text-[10px] font-medium uppercase tracking-[0.14em]"
            style={{ color: "var(--text-muted)" }}
          >
            Workspace
          </p>
          {builderOsVisible ? (
            <div className="mt-2 px-1.5">
              <button
                type="button"
                onClick={() => setBuilderOsExpanded((current) => !current)}
                className={cn(
                  "group flex w-full items-center justify-between rounded-[16px] px-2.5 py-[9px] text-[12px] font-medium transition-all duration-150",
                  builderOsActive
                    ? "bg-[var(--bg-active)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Rocket className="h-[15px] w-[15px] shrink-0" />
                  <span className="truncate">Builder OS</span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-150",
                    builderOsExpanded ? "rotate-180" : "",
                  )}
                />
              </button>
              {builderOsExpanded ? (
                <div className="mt-2 ml-4 space-y-1 border-l border-[var(--border-subtle)] pl-3">
                  <Link
                    href="/app/builder-os"
                    className={cn(
                      "flex items-center gap-2 rounded-[14px] px-2.5 py-2 text-[11px] transition-all duration-150",
                      pathname === "/app/builder-os"
                        ? "bg-[var(--bg-active)] text-[var(--text-primary)] border-l-2 border-[var(--accent-color)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] border-l-2 border-transparent",
                    )}
                  >
                    <Rocket className="h-[13px] w-[13px] shrink-0" />
                    <span className="truncate">Overview</span>
                  </Link>
                  {builderSidebarModules.map((module) => {
                    const href = `/app/builder-os/${module.slug}`;
                    const isActive = pathname === href;
                    const Icon = module.icon;

                    return (
                      <Link
                        key={module.slug}
                        href={href}
                        className={cn(
                          "flex items-center gap-2 rounded-[14px] px-2.5 py-2 text-[11px] transition-all duration-150",
                          isActive
                            ? "bg-[var(--bg-active)] text-[var(--text-primary)] border-l-2 border-[var(--accent-color)]"
                            : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] border-l-2 border-transparent",
                        )}
                      >
                        <Icon className="h-[13px] w-[13px] shrink-0" />
                        <span className="truncate">{module.title}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
          {founderOsVisible ? (
            <div className="mt-2 px-1.5">
              <button
                type="button"
                onClick={() => setFounderOsExpanded((current) => !current)}
                className={cn(
                  "group flex w-full items-center justify-between rounded-[16px] px-2.5 py-[9px] text-[12px] font-medium transition-all duration-150",
                  founderOsActive
                    ? "bg-[var(--bg-active)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Rocket className="h-[15px] w-[15px] shrink-0" />
                  <span className="truncate">Founder OS</span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-150",
                    founderOsExpanded ? "rotate-180" : "",
                  )}
                />
              </button>
              {founderOsExpanded ? (
                <div className="mt-2 space-y-1 border-l border-[var(--border-subtle)] pl-3 ml-4">
                  <Link
                    href="/app/founder-os"
                    className={cn(
                      "flex items-center gap-2 rounded-[14px] px-2.5 py-2 text-[11px] transition-all duration-150",
                      pathname === "/app/founder-os"
                        ? "bg-[var(--bg-active)] text-[var(--text-primary)] border-l-2 border-[var(--accent-color)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] border-l-2 border-transparent",
                    )}
                  >
                    <Rocket className="h-[13px] w-[13px] shrink-0" />
                    <span className="truncate">Overview</span>
                  </Link>
                  {founderSidebarModules.map((module) => {
                    const href = `/app/founder-os/${module.slug}`;
                    const isActive = pathname === href;
                    const Icon = module.icon;

                    return (
                      <Link
                        key={module.slug}
                        href={href}
                        className={cn(
                          "flex items-center gap-2 rounded-[14px] px-2.5 py-2 text-[11px] transition-all duration-150",
                          isActive
                            ? "bg-[var(--bg-active)] text-[var(--text-primary)] border-l-2 border-[var(--accent-color)]"
                            : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] border-l-2 border-transparent",
                        )}
                      >
                        <Icon className="h-[13px] w-[13px] shrink-0" />
                        <span className="truncate">{module.title}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
          {investorOsVisible ? (
            <div className="mt-2 px-1.5">
              <button
                type="button"
                onClick={() => setInvestorOsExpanded((current) => !current)}
                className={cn(
                  "group flex w-full items-center justify-between rounded-[16px] px-2.5 py-[9px] text-[12px] font-medium transition-all duration-150",
                  investorOsActive
                    ? "bg-[var(--bg-active)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Rocket className="h-[15px] w-[15px] shrink-0" />
                  <span className="truncate">Investor OS</span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-150",
                    investorOsExpanded ? "rotate-180" : "",
                  )}
                />
              </button>
              {investorOsExpanded ? (
                <div className="mt-2 ml-4 space-y-1 border-l border-[var(--border-subtle)] pl-3">
                  <Link
                    href="/app/investor-os"
                    className={cn(
                      "flex items-center gap-2 rounded-[14px] px-2.5 py-2 text-[11px] transition-all duration-150",
                      pathname === "/app/investor-os"
                        ? "bg-[var(--bg-active)] text-[var(--text-primary)] border-l-2 border-[var(--accent-color)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] border-l-2 border-transparent",
                    )}
                  >
                    <Rocket className="h-[13px] w-[13px] shrink-0" />
                    <span className="truncate">Overview</span>
                  </Link>
                  {investorSidebarModules.map((module) => {
                    const href = `/app/investor-os/${module.slug}`;
                    const isActive = pathname === href;
                    const Icon = module.icon;

                    return (
                      <Link
                        key={module.slug}
                        href={href}
                        className={cn(
                          "flex items-center gap-2 rounded-[14px] px-2.5 py-2 text-[11px] transition-all duration-150",
                          isActive
                            ? "bg-[var(--bg-active)] text-[var(--text-primary)] border-l-2 border-[var(--accent-color)]"
                            : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] border-l-2 border-transparent",
                        )}
                      >
                        <Icon className="h-[13px] w-[13px] shrink-0" />
                        <span className="truncate">{module.title}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <div>
          <p
            className="mb-1 px-3 text-[10px] font-medium uppercase tracking-[0.14em]"
            style={{ color: "var(--text-muted)" }}
          >
            System
          </p>
          <NavSection items={systemItems} pathname={pathname} role={user.role} enabledWorkspaces={enabledWorkspaces} />
        </div>
      </nav>

      {/* Bottom */}
      <div className="p-3" style={{ borderTop: "0.5px solid var(--border-subtle)" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2.5 rounded-[var(--radius-lg)] px-2.5 py-[7px] text-[12px] font-medium transition-all duration-150 mx-0 hover:opacity-80"
          style={{ color: "var(--text-muted)" }}
        >
          <LogOut className="h-[15px] w-[15px]" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export function AppMobileNav({ user, enabledWorkspaces = [] }: { user: SidebarUser; enabledWorkspaces?: AppWorkspace[] }) {
  const pathname = usePathname();
  const visible = [...systemItems, ...osItems]
    .filter((item) => canAccessRole(item, user.role) && canAccessWorkspace(item, enabledWorkspaces))
    .slice(0, 9);

  return (
    <div
      className="px-3 py-2 md:hidden"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderBottom: "0.5px solid var(--border-subtle)",
      }}
    >
      <div className="flex gap-2 overflow-x-auto pb-1">
        {visible.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors",
                isActive
                  ? "text-[var(--accent-soft)]"
                  : "text-[var(--text-muted)]",
              )}
              style={{
                borderColor: isActive ? "var(--border-accent)" : "var(--border-subtle)",
                backgroundColor: isActive ? "var(--accent-dim)" : "var(--bg-elevated)",
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

