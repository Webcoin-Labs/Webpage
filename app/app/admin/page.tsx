import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { AdminApplicationsTable } from "@/components/app/AdminApplicationsTable";
import { Mail, MessageSquare, Building2, Gift, Shield, CalendarDays, BriefcaseBusiness, FileText, UsersRound, DatabaseZap, Upload } from "lucide-react";
import { createAdminAssignmentAction, overrideScoreSnapshotAction, updateAdminAssignmentStatusAction } from "@/app/actions/canonical-graph";

export const metadata = { title: "Admin — Webcoin Labs" };

export default async function AdminPage() {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") redirect("/app");

    const [applications, users, projects, buildersCount, partnersCount, leadsCount, introsCount, jobsCount, jobApplicationsCount, pitchDecksCount, reportsCount, hiringInterestCount, foundersWithLogoCount, usersWithAvatarCount, uploadAssetsCount, openAssignmentsCount, scoreReviewCount, recentAssignments, recentScoreSnapshots] = await Promise.all([
        db.application.findMany({
            include: { user: { select: { name: true, email: true, image: true } } },
            orderBy: { createdAt: "desc" },
            take: 200,
        }),
        db.user.count(),
        db.project.count(),
        db.builderProfile.count(),
        db.partner.count(),
        db.lead.count(),
        db.introRequest.count(),
        db.jobPost.count(),
        db.jobApplication.count(),
        db.pitchDeck.count(),
        db.aIReport.count(),
        db.hiringInterest.count(),
        db.founderProfile.count({ where: { companyLogoUrl: { not: null } } }),
        db.user.count({ where: { image: { not: null } } }),
        db.uploadAsset.count(),
        db.adminAssignment.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
        db.scoreSnapshot.count({ where: { status: { in: ["UNDER_REVIEW", "OVERRIDDEN"] } } }),
        db.adminAssignment.findMany({
            orderBy: { updatedAt: "desc" },
            take: 8,
            select: {
                id: true,
                type: true,
                status: true,
                note: true,
                createdAt: true,
                founderUser: { select: { id: true, name: true } },
                builderUser: { select: { id: true, name: true } },
                investorUser: { select: { id: true, name: true } },
                venture: { select: { id: true, name: true } },
            },
        }),
        db.scoreSnapshot.findMany({
            orderBy: { computedAt: "desc" },
            take: 8,
            select: {
                id: true,
                kind: true,
                status: true,
                score: true,
                label: true,
                computedAt: true,
                scoredUser: { select: { id: true, name: true } },
                venture: { select: { id: true, name: true } },
            },
        }),
    ]);

    const adminLinks = [
        { href: "/app/admin/leads", label: "Leads", icon: Mail, count: leadsCount },
        { href: "/app/admin/intros", label: "Intro Requests", icon: MessageSquare, count: introsCount },
        { href: "/app/admin/events", label: "Events", icon: CalendarDays },
        { href: "/app/admin/pitch-decks", label: "Pitch Decks & Reports", icon: FileText, count: pitchDecksCount },
        { href: "/app/admin/jobs", label: "Jobs", icon: BriefcaseBusiness, count: jobsCount },
        { href: "/app/admin/hiring-interests", label: "Hiring Interests", icon: UsersRound, count: hiringInterestCount },
        { href: "/app/admin/uploads", label: "Uploads", icon: Upload, count: uploadAssetsCount },
        { href: "/app/admin/storage", label: "Storage Health", icon: DatabaseZap },
        { href: "/app/admin/partners", label: "Partners", icon: Building2 },
        { href: "/app/admin/moderation", label: "Moderation", icon: Shield },
        { href: "/app/admin/rewards", label: "Rewards", icon: Gift },
        { href: "/app/admin/notifications", label: "Notifications", icon: MessageSquare },
    ];

    const createAssignmentFormAction = async (formData: FormData) => {
        "use server";
        await createAdminAssignmentAction(formData);
    };
    const updateAssignmentFormAction = async (formData: FormData) => {
        "use server";
        await updateAdminAssignmentStatusAction(formData);
    };
    const overrideScoreFormAction = async (formData: FormData) => {
        "use server";
        await overrideScoreSnapshotAction(formData);
    };

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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-10 gap-4">
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
                <div className="p-5 rounded-xl border border-border/50 bg-card text-center">
                    <p className="text-2xl font-black gradient-text">{jobsCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Job Posts</p>
                </div>
                <div className="p-5 rounded-xl border border-border/50 bg-card text-center">
                    <p className="text-2xl font-black gradient-text">{jobApplicationsCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Job Applications</p>
                </div>
                <div className="p-5 rounded-xl border border-border/50 bg-card text-center">
                    <p className="text-2xl font-black gradient-text">{reportsCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">AI Reports</p>
                </div>
                <div className="p-5 rounded-xl border border-border/50 bg-card text-center">
                    <p className="text-2xl font-black gradient-text">{hiringInterestCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Hiring Interests</p>
                </div>
                <div className="p-5 rounded-xl border border-border/50 bg-card text-center">
                    <p className="text-2xl font-black gradient-text">{foundersWithLogoCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Founder Logos</p>
                </div>
                <div className="p-5 rounded-xl border border-border/50 bg-card text-center">
                    <p className="text-2xl font-black gradient-text">{usersWithAvatarCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Profile Images</p>
                </div>
                <div className="p-5 rounded-xl border border-border/50 bg-card text-center">
                    <p className="text-2xl font-black gradient-text">{uploadAssetsCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Upload Assets</p>
                </div>
                <div className="p-5 rounded-xl border border-border/50 bg-card text-center">
                    <p className="text-2xl font-black gradient-text">{openAssignmentsCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Open Assignments</p>
                </div>
                <div className="p-5 rounded-xl border border-border/50 bg-card text-center">
                    <p className="text-2xl font-black gradient-text">{scoreReviewCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Score Review Queue</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-xl border border-border/50 bg-card p-5">
                    <h2 className="text-lg font-semibold mb-3">Create Admin Assignment</h2>
                    <form action={createAssignmentFormAction} className="space-y-2">
                        <select name="type" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                            <option value="BUILDER_TO_FOUNDER">Builder to Founder</option>
                            <option value="FOUNDER_TO_INVESTOR">Founder to Investor</option>
                            <option value="INVESTOR_TO_VENTURE_REVIEW">Investor Venture Review</option>
                            <option value="PROFILE_REVIEW">Profile Review</option>
                            <option value="TRUST_REVIEW">Trust Review</option>
                        </select>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <input name="founderUserId" placeholder="Founder userId (optional)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
                            <input name="builderUserId" placeholder="Builder userId (optional)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <input name="investorUserId" placeholder="Investor userId (optional)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
                            <input name="ventureId" placeholder="Venture id (optional)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
                        </div>
                        <textarea name="note" placeholder="Assignment note" rows={2} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
                        <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
                            Create assignment
                        </button>
                    </form>
                </section>

                <section className="rounded-xl border border-border/50 bg-card p-5">
                    <h2 className="text-lg font-semibold mb-3">Recent Assignments</h2>
                    <div className="space-y-2">
                        {recentAssignments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No assignments yet.</p>
                        ) : (
                            recentAssignments.map((assignment) => (
                                <div key={assignment.id} className="rounded-md border border-border/60 p-3">
                                    <p className="text-sm font-medium">{assignment.type}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {assignment.founderUser?.name ?? "Founder -"} | {assignment.builderUser?.name ?? "Builder -"} | {assignment.investorUser?.name ?? "Investor -"}
                                    </p>
                                    {assignment.venture?.name ? <p className="text-xs text-muted-foreground">Venture: {assignment.venture.name}</p> : null}
                                    {assignment.note ? <p className="text-xs text-muted-foreground mt-1">{assignment.note}</p> : null}
                                    <form action={updateAssignmentFormAction} className="mt-2 flex gap-2">
                                        <input type="hidden" name="assignmentId" value={assignment.id} />
                                        <select name="status" defaultValue={assignment.status} className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                                            <option value="OPEN">OPEN</option>
                                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                                            <option value="RESOLVED">RESOLVED</option>
                                            <option value="DISMISSED">DISMISSED</option>
                                        </select>
                                        <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs">Update</button>
                                    </form>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            <section className="rounded-xl border border-border/50 bg-card p-5">
                <h2 className="text-lg font-semibold mb-3">Score Review Queue</h2>
                <div className="space-y-2">
                    {recentScoreSnapshots.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No score snapshots yet.</p>
                    ) : (
                        recentScoreSnapshots.map((snapshot) => (
                            <div key={snapshot.id} className="rounded-md border border-border/60 p-3">
                                <p className="text-sm font-medium">
                                    {snapshot.kind} | {snapshot.score} ({snapshot.label ?? "n/a"})
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    User: {snapshot.scoredUser?.name ?? "n/a"} | Venture: {snapshot.venture?.name ?? "n/a"} | {new Date(snapshot.computedAt).toLocaleString()}
                                </p>
                                <form action={overrideScoreFormAction} className="mt-2 flex flex-wrap gap-2">
                                    <input type="hidden" name="snapshotId" value={snapshot.id} />
                                    <select name="status" defaultValue={snapshot.status} className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                                        <option value="OVERRIDDEN">OVERRIDDEN</option>
                                        <option value="ARCHIVED">ARCHIVED</option>
                                    </select>
                                    <input name="reason" placeholder="Override reason" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                                    <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs">Apply</button>
                                </form>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Applications table */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Applications</h2>
                <AdminApplicationsTable applications={applications} />
            </div>
        </div>
    );
}
