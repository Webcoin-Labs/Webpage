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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarUser {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
}

const navItems = [
    { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/app/events", label: "Events", icon: CalendarDays },
    { href: "/app/profile", label: "Profile", icon: User },
    { href: "/app/projects", label: "Projects", icon: FolderKanban },
    { href: "/app/apply", label: "Apply", icon: FileText },
    { href: "/app/applications", label: "My Applications", icon: FileCheck },
    { href: "/app/intros", label: "Intro Requests", icon: MessageSquare },
    { href: "/app/rewards", label: "Rewards", icon: Gift },
    { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({ user }: { user: SidebarUser }) {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 border-r border-border/50 bg-card/50 backdrop-blur-xl">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-border/50">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                        W
                    </div>
                    <span className="font-bold text-sm text-foreground">Webcoin Labs</span>
                </Link>
            </div>

            {/* User info */}
            <div className="px-4 py-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                    {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.image} alt={user.name ?? ""} className="w-8 h-8 rounded-full" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                            {user.name?.charAt(0) ?? user.email?.charAt(0) ?? "U"}
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{user.name ?? "User"}</p>
                        <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-medium",
                            user.role === "BUILDER" ? "bg-cyan-500/10 text-cyan-400" :
                                user.role === "FOUNDER" ? "bg-violet-500/10 text-violet-400" :
                                    user.role === "ADMIN" ? "bg-amber-500/10 text-amber-400" :
                                        "bg-slate-500/10 text-slate-400"
                        )}>
                            {user.role}
                        </span>
                    </div>
                </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-accent text-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            )}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {item.label}
                        </Link>
                    );
                })}

                {user.role === "ADMIN" && (
                    <Link
                        href="/app/admin"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-4",
                            pathname.startsWith("/app/admin")
                                ? "bg-amber-500/10 text-amber-400"
                                : "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
                        )}
                    >
                        <Shield className="w-4 h-4" />
                        Admin
                    </Link>
                )}
            </nav>

            {/* Bottom */}
            <div className="p-3 border-t border-border/50 space-y-0.5">
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
                <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                    ← Public Site
                </Link>
            </div>
        </aside>
    );
}
