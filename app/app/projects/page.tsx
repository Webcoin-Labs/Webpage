import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, FolderKanban, ArrowRight } from "lucide-react";
import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";

export const metadata = { title: "Projects — Webcoin Labs" };

const stageMap: Record<string, string> = { IDEA: "Idea", MVP: "MVP", LIVE: "Live" };

export default async function ProjectsPage() {
    const session = await getServerSession(authOptions);
    const user = session!.user;
    const isFounder = user.role === "FOUNDER" || user.role === "ADMIN";

    const founderProfile = isFounder
        ? await prisma.founderProfile.findUnique({
            where: { userId: user.id },
            select: { companyName: true, roleTitle: true, isHiring: true },
        })
        : null;

    const projects = await prisma.project.findMany({
        where: { ownerUserId: user.id },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-6 py-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Projects</h1>
                    <p className="text-muted-foreground mt-1">{isFounder ? "Your project profiles." : "Projects you're tracking."}</p>
                    {isFounder && founderProfile?.companyName ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <ProfileAffiliationTag label={founderProfile.companyName} variant="founder" />
                            <span className="text-xs text-muted-foreground">{founderProfile.roleTitle ?? "Founder"}</span>
                            {founderProfile.isHiring ? (
                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200">
                                    Hiring
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                </div>
                {isFounder && (
                    <Link href="/app/projects/new" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                        <Plus className="w-4 h-4" /> New Project
                    </Link>
                )}
            </div>

            {projects.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-border/50 rounded-xl">
                    <FolderKanban className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="font-medium mb-1">No projects yet</p>
                    <p className="text-sm text-muted-foreground mb-6">
                        {isFounder ? "Create your first project profile to get started." : "You haven't joined any projects yet."}
                    </p>
                    {isFounder && (
                        <Link href="/app/projects/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/10 text-violet-400 text-sm font-medium border border-violet-500/20 hover:bg-violet-500/20 transition-colors">
                            <Plus className="w-4 h-4" /> Create Project
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project) => (
                        <div key={project.id} className="p-5 rounded-xl border border-border/50 bg-card hover:border-cyan-500/20 transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <h2 className="font-semibold">{project.name}</h2>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${project.stage === "LIVE" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                                        project.stage === "MVP" ? "bg-violet-500/10 text-violet-400 border-violet-500/20" :
                                            "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    }`}>
                                    {stageMap[project.stage]}
                                </span>
                            </div>
                            {project.tagline && <p className="text-sm text-muted-foreground mb-2">{project.tagline}</p>}
                            {project.chainFocus && <p className="text-xs text-muted-foreground">Chain: {project.chainFocus}</p>}
                            <p className="text-xs text-muted-foreground mt-3">
                                Created {new Date(project.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
