import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminApplicationsTable } from "@/components/app/AdminApplicationsTable";
import { Mail, MessageSquare, Building2, Gift, Shield, CalendarDays } from "lucide-react";

export const metadata = { title: "Admin — Webcoin Labs" };

export default async function AdminPage() {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") redirect("/app");

    const [applications, users, projects, buildersCount, partnersCount, leadsCount, introsCount] = await Promise.all([
        prisma.application.findMany({
            include: { user: { select: { name: true, email: true, image: true } } },
            orderBy: { createdAt: "desc" },
            take: 200,
        }),
        prisma.user.count(),
        prisma.project.count(),
        prisma.builderProfile.count(),
        prisma.partner.count(),
        prisma.lead.count(),
        prisma.introRequest.count(),
    ]);

    const adminLinks = [
        { href: "/app/admin/leads", label: "Leads", icon: Mail, count: leadsCount },
        { href: "/app/admin/intros", label: "Intro Requests", icon: MessageSquare, count: introsCount },
        { href: "/app/admin/events", label: "Events", icon: CalendarDays },
        { href: "/app/admin/partners", label: "Partners", icon: Building2 },
        { href: "/app/admin/moderation", label: "Moderation", icon: Shield },
        { href: "/app/admin/rewards", label: "Rewards", icon: Gift },
    ];

    return (
        <div className="space-y-8 py-8">
            <div>
                <h1 className="text-2xl font-bold">Admin</h1>
                <p className="text-muted-foreground mt-1">Manage applications, intro requests, partners, and moderation.</p>
            </div>

            {/* Quick links */}
            <div className="flex flex-wrap gap-3">
                {adminLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border/50 bg-card hover:border-cyan-500/30 text-sm font-medium"
                        >
                            <Icon className="w-4 h-4" />
                            {link.label}
                            {"count" in link && link.count !== undefined && (
                                <span className="text-xs text-muted-foreground">({link.count})</span>
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-5 rounded-xl border border-border/50 bg-card text-center">
                    <p className="text-2xl font-black gradient-text">{users}</p>
                    <p className="text-xs text-muted-foreground mt-1">Users</p>
                </div>
                <div className="p-5 rounded-xl border border-border/50 bg-card text-center">
                    <p className="text-2xl font-black gradient-text">{buildersCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Builders</p>
                </div>
                <div className="p-5 rounded-xl border border-border/50 bg-card text-center">
                    <p className="text-2xl font-black gradient-text">{projects}</p>
                    <p className="text-xs text-muted-foreground mt-1">Projects</p>
                </div>
                <div className="p-5 rounded-xl border border-border/50 bg-card text-center">
                    <p className="text-2xl font-black gradient-text">{applications.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Applications</p>
                </div>
                <div className="p-5 rounded-xl border border-border/50 bg-card text-center">
                    <p className="text-2xl font-black gradient-text">{partnersCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Partners</p>
                </div>
                <div className="p-5 rounded-xl border border-border/50 bg-card text-center">
                    <p className="text-2xl font-black gradient-text">{introsCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Intro Requests</p>
                </div>
            </div>

            {/* Applications table */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Applications</h2>
                <AdminApplicationsTable applications={applications} />
            </div>
        </div>
    );
}
