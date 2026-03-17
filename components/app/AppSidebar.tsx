"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  User,
  FolderKanban,
  FileText,
  FileCheck,
  MessageSquare,
  Settings,
  LogOut,
  Shield,
  Gift,
  CalendarDays,
  BriefcaseBusiness,
  UsersRound,
  Crown,
  BellRing,
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

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  roles?: Array<"BUILDER" | "FOUNDER" | "INVESTOR" | "ADMIN">;
};

const navItems: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/events", label: "Events", icon: CalendarDays },
  { href: "/app/profile", label: "Profile", icon: User },
  { href: "/app/projects", label: "Projects", icon: FolderKanban, roles: ["FOUNDER", "ADMIN", "INVESTOR"] },
  { href: "/app/apply", label: "Apply", icon: FileText, roles: ["FOUNDER", "BUILDER", "ADMIN"] },
  { href: "/app/applications", label: "My Applications", icon: FileCheck, roles: ["FOUNDER", "BUILDER", "ADMIN"] },
  { href: "/app/intros", label: "Intro Requests", icon: MessageSquare, roles: ["FOUNDER", "ADMIN"] },
  { href: "/app/kols-premium", label: "KOL Premium", icon: Crown, roles: ["FOUNDER", "ADMIN"] },
  { href: "/app/jobs", label: "Jobs", icon: BriefcaseBusiness, roles: ["FOUNDER", "BUILDER", "ADMIN"] },
  { href: "/app/hiring", label: "Hiring", icon: UsersRound, roles: ["FOUNDER", "BUILDER", "ADMIN"] },
  { href: "/app/messages", label: "Messages", icon: BellRing, roles: ["FOUNDER", "BUILDER", "ADMIN"] },
  { href: "/app/rewards", label: "Rewards", icon: Gift, roles: ["FOUNDER", "BUILDER", "ADMIN"] },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

function canAccess(item: NavItem, role: string) {
  if (!item.roles || item.roles.length === 0) return true;
  if (role === "ADMIN") return true;
  return item.roles.includes(role as "BUILDER" | "FOUNDER" | "INVESTOR" | "ADMIN");
}

export function AppSidebar({
  user,
  affiliation,
}: {
  user: SidebarUser;
  affiliation?: SidebarAffiliation | null;
}) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => canAccess(item, user.role));

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border/50 bg-card/50 backdrop-blur-xl md:flex">
      <div className="flex h-16 items-center border-b border-border/50 px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500 text-xs font-bold text-white">
            W
          </div>
          <span className="text-sm font-bold text-foreground">Webcoin Labs</span>
        </Link>
      </div>

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
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-medium",
                  user.role === "BUILDER"
                    ? "bg-cyan-500/10 text-cyan-400"
                    : user.role === "FOUNDER"
                      ? "bg-violet-500/10 text-violet-400"
                      : user.role === "ADMIN"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-slate-500/10 text-slate-400",
                )}
              >
                {user.role}
              </span>
              {affiliation ? (
                <ProfileAffiliationTag label={affiliation.label} variant={affiliation.variant} size="sm" />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {user.role === "ADMIN" ? (
          <Link
            href="/app/admin"
            className={cn(
              "mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/app/admin")
                ? "bg-amber-500/10 text-amber-400"
                : "text-muted-foreground hover:bg-amber-500/10 hover:text-amber-400",
            )}
          >
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        ) : null}
      </nav>

      <div className="space-y-0.5 border-t border-border/50 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          Back to Site
        </Link>
      </div>
    </aside>
  );
}

export function AppMobileNav({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const visibleItems = navItems
    .filter((item) => canAccess(item, user.role))
    .filter((item) => item.href !== "/app/settings")
    .slice(0, 7);

  return (
    <div className="border-b border-border/50 bg-background/95 px-3 py-2 md:hidden">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs",
                isActive
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                  : "border-border/70 bg-card text-muted-foreground",
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
