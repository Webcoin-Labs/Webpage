import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, FileText, User, FolderKanban, CheckCircle2 } from "lucide-react";

export default async function AppDashboard() {
    const session = await getServerSession(authOptions);
    const user = session!.user;

    const [applications, projects] = await Promise.all([
        prisma.application.count({ where: { userId: user.id } }),
        prisma.project.count({ where: { ownerUserId: user.id } }),
    ]);

    const hasBuilderProfile = !!(await prisma.builderProfile.findUnique({ where: { userId: user.id } }));
    const hasFounderProfile = !!(await prisma.founderProfile.findUnique({ where: { userId: user.id } }));

    const isBuilder = user.role === "BUILDER";
    const isFounder = user.role === "FOUNDER";

    return (
        <div className="space-y-8 py-8">
            <div>
                <h1 className="text-2xl font-bold">
                    Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
                </h1>
                <p className="text-muted-foreground mt-1">
                    Your Webcoin Labs portal.{" "}
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${user.role === "BUILDER" ? "bg-cyan-500/10 text-cyan-400" :
                            user.role === "FOUNDER" ? "bg-violet-500/10 text-violet-400" :
                                "bg-amber-500/10 text-amber-400"
                        }`}>{user.role}</span>
                </p>
            </div>

            {/* Profile setup prompt */}
            {isBuilder && !hasBuilderProfile && (
                <div className="p-5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 flex items-center justify-between">
                    <div>
                        <p className="font-semibold mb-1">Set up your Builder Profile</p>
                        <p className="text-sm text-muted-foreground">Add your skills, links, and interests to get discovered.</p>
                    </div>
                    <Link href="/app/profile" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-sm font-medium transition-colors whitespace-nowrap">
                        Set up <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}
            {isFounder && !hasFounderProfile && (
                <div className="p-5 rounded-xl border border-violet-500/30 bg-violet-500/5 flex items-center justify-between">
                    <div>
                        <p className="font-semibold mb-1">Set up your Founder Profile</p>
                        <p className="text-sm text-muted-foreground">Tell us about your project and get matched with support.</p>
                    </div>
                    <Link href="/app/profile" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-sm font-medium transition-colors whitespace-nowrap">
                        Set up <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/app/profile" className="group p-5 rounded-xl border border-border/50 bg-card hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="text-sm font-medium">Profile</span>
                    </div>
                    <p className="text-2xl font-bold">{hasBuilderProfile || hasFounderProfile ? "✓" : "—"}</p>
                    <p className="text-xs text-muted-foreground mt-1">{hasBuilderProfile || hasFounderProfile ? "Profile complete" : "Not set up"}</p>
                </Link>

                <Link href="/app/projects" className="group p-5 rounded-xl border border-border/50 bg-card hover:border-violet-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                            <FolderKanban className="w-4 h-4 text-violet-400" />
                        </div>
                        <span className="text-sm font-medium">Projects</span>
                    </div>
                    <p className="text-2xl font-bold">{projects}</p>
                    <p className="text-xs text-muted-foreground mt-1">Project{projects !== 1 ? "s" : ""} created</p>
                </Link>

                <Link href="/app/apply" className="group p-5 rounded-xl border border-border/50 bg-card hover:border-amber-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-amber-400" />
                        </div>
                        <span className="text-sm font-medium">Applications</span>
                    </div>
                    <p className="text-2xl font-bold">{applications}</p>
                    <p className="text-xs text-muted-foreground mt-1">Application{applications !== 1 ? "s" : ""} submitted</p>
                </Link>
            </div>

            {/* Quick links */}
            <div>
                <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {isBuilder && (
                        <Link href="/app/apply" className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card hover:border-cyan-500/20 transition-all">
                            <FileText className="w-4 h-4 text-cyan-400" />
                            <div>
                                <p className="text-sm font-medium">Apply to Builder Program</p>
                                <p className="text-xs text-muted-foreground">Join a cohort</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                        </Link>
                    )}
                    {isFounder && (
                        <>
                            <Link href="/app/projects/new" className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card hover:border-violet-500/20 transition-all">
                                <FolderKanban className="w-4 h-4 text-violet-400" />
                                <div>
                                    <p className="text-sm font-medium">Create Project Profile</p>
                                    <p className="text-xs text-muted-foreground">Share your project</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                            </Link>
                            <Link href="/app/apply" className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card hover:border-violet-500/20 transition-all">
                                <CheckCircle2 className="w-4 h-4 text-violet-400" />
                                <div>
                                    <p className="text-sm font-medium">Apply for Founder Support</p>
                                    <p className="text-xs text-muted-foreground">Advisory &amp; capital readiness</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
