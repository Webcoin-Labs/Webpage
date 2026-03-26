"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  BellRing,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LogOut,
  Rocket,
  Settings,
  User,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";

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
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/workspaces", label: "Apps / Launcher", icon: Compass },
  { href: "/app/notifications", label: "Inbox", icon: Inbox },
  { href: "/app/events", label: "Tasks / Activity", icon: BellRing },
  { href: "/app/founders", label: "People / Network", icon: User },
  { href: "/app/ecosystem-feed", label: "Ecosystem Feed", icon: Compass },
  { href: "/app/docs", label: "Docs", icon: BookOpen },
  { href: "/app/projects", label: "Files / Data Room", icon: FolderKanban, roles: ["FOUNDER", "ADMIN"] },
  { href: "/app/builder-projects", label: "Files / Data Room", icon: FolderKanban, roles: ["BUILDER", "ADMIN"] },
  { href: "/app/settings", label: "Integrations", icon: Wrench },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

const osItems: NavItem[] = [
  { href: "/app/founder-os", label: "Founder OS", icon: Rocket, roles: ["FOUNDER", "BUILDER", "ADMIN"], workspace: "FOUNDER_OS" },
  { href: "/app/builder-os", label: "Builder OS", icon: Rocket, roles: ["BUILDER", "FOUNDER", "ADMIN"], workspace: "BUILDER_OS" },
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

function NavSection({
  items,
  pathname,
  role,
  enabledWorkspaces,
  collapsed,
}: {
  items: NavItem[];
  pathname: string;
  role: string;
  enabledWorkspaces: AppWorkspace[];
  collapsed: boolean;
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
                "group flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors",
                collapsed ? "justify-center" : "gap-3",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("webcoin.sidebar.collapsed");
    if (saved === "1") {
      setCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    const nextValue = !collapsed;
    setCollapsed(nextValue);
    window.localStorage.setItem("webcoin.sidebar.collapsed", nextValue ? "1" : "0");
  };

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/50 bg-card/70 backdrop-blur-xl md:flex",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-border/50", collapsed ? "justify-center px-2" : "justify-between px-4")}>
        <Link href="/" className={cn("flex items-center", collapsed ? "justify-center" : "gap-2")}>
          <Image src="/logo/webcoinlogo.webp" alt="Webcoin Labs" width={28} height={28} className="hidden rounded-md dark:block" />
          <Image src="/logo/webcoinlight.webp" alt="Webcoin Labs" width={28} height={28} className="rounded-md dark:hidden" />
          {!collapsed ? <span className="text-sm font-bold text-foreground">Webcoin Labs</span> : null}
        </Link>
        {!collapsed ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="rounded-md border border-border/60 bg-card px-2 py-1 text-muted-foreground hover:text-foreground"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {collapsed ? (
        <div className="flex justify-center border-b border-border/50 py-2">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="rounded-md border border-border/60 bg-card p-1.5 text-muted-foreground hover:text-foreground"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="border-b border-border/50 px-4 py-4">
          <div className="flex items-center gap-3">
            <ProfileAvatar
              src={user.image}
              alt={user.name ?? "User"}
              fallback={user.name?.charAt(0) ?? user.email?.charAt(0) ?? "U"}
              className="h-8 w-8 rounded-full"
              fallbackClassName="bg-blue-500 text-xs font-bold text-white"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name ?? "User"}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300">{user.role}</span>
                {affiliation ? <ProfileAffiliationTag label={affiliation.label} variant={affiliation.variant} size="sm" /> : null}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        <div>
          {!collapsed ? <p className="px-2 pb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">System</p> : null}
          <div className="space-y-0.5">
            <NavSection items={systemItems} pathname={pathname} role={user.role} enabledWorkspaces={enabledWorkspaces} collapsed={collapsed} />
          </div>
        </div>
        <div>
          {!collapsed ? <p className="px-2 pb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Operating Systems</p> : null}
          <div className="space-y-0.5">
            <NavSection items={osItems} pathname={pathname} role={user.role} enabledWorkspaces={enabledWorkspaces} collapsed={collapsed} />
          </div>
        </div>
      </nav>

      <div className="space-y-0.5 border-t border-border/50 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cn(
            "flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground",
            collapsed ? "justify-center" : "gap-3",
          )}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed ? "Sign Out" : null}
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
    <div className="border-b border-border/50 bg-background/95 px-3 py-2 md:hidden">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {visible.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs",
                isActive ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-border/70 bg-card text-muted-foreground",
              )}
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

