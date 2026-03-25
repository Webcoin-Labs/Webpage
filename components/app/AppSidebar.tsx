"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BellRing,
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

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Array<"BUILDER" | "FOUNDER" | "INVESTOR" | "ADMIN">;
  exact?: boolean;
};

const systemItems: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/workspaces", label: "Apps / Launcher", icon: Compass },
  { href: "/app/notifications", label: "Inbox", icon: Inbox },
  { href: "/app/events", label: "Tasks / Activity", icon: BellRing },
  { href: "/app/founders", label: "People / Network", icon: User },
  { href: "/app/projects", label: "Files / Data Room", icon: FolderKanban, roles: ["FOUNDER", "ADMIN"] },
  { href: "/app/builder-projects", label: "Files / Data Room", icon: FolderKanban, roles: ["BUILDER", "ADMIN"] },
  { href: "/app/settings", label: "Integrations", icon: Wrench },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

const osItems: NavItem[] = [
  { href: "/app/founder-os", label: "Founder OS", icon: Rocket, roles: ["FOUNDER", "BUILDER", "ADMIN"] },
  { href: "/app/builder-os", label: "Builder OS", icon: Rocket, roles: ["BUILDER", "FOUNDER", "ADMIN"] },
  { href: "/app/investor-os", label: "Investor OS", icon: Rocket, roles: ["INVESTOR", "ADMIN"] },
];

function canAccess(item: NavItem, role: string) {
  if (!item.roles || item.roles.length === 0) return true;
  if (role === "ADMIN") return true;
  return item.roles.includes(role as "BUILDER" | "FOUNDER" | "INVESTOR" | "ADMIN");
}

function NavSection({ items, pathname, role }: { items: NavItem[]; pathname: string; role: string }) {
  return (
    <>
      {items.filter((item) => canAccess(item, role)).map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AppSidebar({
  user,
  affiliation,
}: {
  user: SidebarUser;
  affiliation?: SidebarAffiliation | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border/50 bg-card/60 backdrop-blur-xl md:flex">
      <div className="flex h-16 items-center border-b border-border/50 px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo/webcoinlogo.webp" alt="Webcoin Labs" width={28} height={28} className="hidden rounded-md dark:block" />
          <Image src="/logo/webcoinlight.webp" alt="Webcoin Labs" width={28} height={28} className="rounded-md dark:hidden" />
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
            <div className="mt-1 flex items-center gap-1.5">
              <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300">{user.role}</span>
              {affiliation ? <ProfileAffiliationTag label={affiliation.label} variant={affiliation.variant} size="sm" /> : null}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        <div>
          <p className="px-2 pb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">System</p>
          <div className="space-y-0.5">
            <NavSection items={systemItems} pathname={pathname} role={user.role} />
          </div>
        </div>
        <div>
          <p className="px-2 pb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Operating Systems</p>
          <div className="space-y-0.5">
            <NavSection items={osItems} pathname={pathname} role={user.role} />
          </div>
        </div>
      </nav>

      <div className="space-y-0.5 border-t border-border/50 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export function AppMobileNav({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const visible = [...systemItems, ...osItems].filter((item) => canAccess(item, user.role)).slice(0, 9);

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

