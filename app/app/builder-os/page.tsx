import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Activity, Briefcase, FileText, Github, Sparkles, Wallet } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { createCoverLetterDraft, saveMiniAppMetadata, upsertResumeDocument } from "@/app/actions/webcoin-os";
import { scoringService } from "@/server/services/scoring.service";
import { recomputeMyScoresAction } from "@/app/actions/canonical-graph";

export const metadata = { title: "Builder OS - Webcoin Labs" };

export default async function BuilderOsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!["BUILDER", "FOUNDER", "ADMIN"].includes(session.user.role)) redirect("/app");

  const [profile, projects, githubConnection, resumes, coverLetters, miniApps, integrationConnections, walletCount, proofExplanation, latestProofSnapshot] = await Promise.all([
    db.builderProfile.findUnique({ where: { userId: session.user.id } }),
    db.builderProject.findMany({ where: { builderId: session.user.id }, orderBy: { updatedAt: "desc" }, take: 10 }),
    db.githubConnection.findUnique({ where: { userId: session.user.id } }),
    db.resumeDocument.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.coverLetterDraft.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.miniAppMetadata.findMany({ where: { ownerUserId: session.user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.integrationConnection.findMany({ where: { userId: session.user.id, status: "CONNECTED" } }),
    db.walletConnection.count({ where: { userId: session.user.id } }),
    scoringService.computeBuilderProofScore(session.user.id),
    db.scoreSnapshot.findFirst({
      where: { kind: "BUILDER_PROOF", scoredUserId: session.user.id },
      orderBy: { computedAt: "desc" },
    }),
  ]);

  const profileCompleteness = Math.round(
    ((proofExplanation.factors.find((factor) => factor.key === "profile")?.value ?? 0) +
      (proofExplanation.factors.find((factor) => factor.key === "resume")?.value ?? 0) +
      (proofExplanation.factors.find((factor) => factor.key === "github_linked")?.value ?? 0)) /
      3 *
      100,
  );

  const proofScore = proofExplanation.score;

  const saveResumeAction = async (formData: FormData) => {
    "use server";
    await upsertResumeDocument(formData);
  };
  const saveCoverLetterAction = async (formData: FormData) => {
    "use server";
    await createCoverLetterDraft(formData);
  };
  const saveMiniAppAction = async (formData: FormData) => {
    "use server";
    await saveMiniAppMetadata(formData);
  };
  const recomputeBuilderScoreAction = async (formData: FormData) => {
    "use server";
    await recomputeMyScoresAction(formData);
  };

  return (
    <div className="space-y-6 py-8">
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="text-2xl font-semibold">Builder OS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Proof-of-work operating system for projects, GitHub signals, collaboration readiness, and founder discovery.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Profile completeness</p>
          <p className="mt-1 text-2xl font-semibold">{profileCompleteness}%</p>
          <div className="mt-2 h-2 rounded-full bg-border">
            <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${profileCompleteness}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Proof score</p>
          <p className="mt-1 text-2xl font-semibold">{proofScore}%</p>
          <div className="mt-2 h-2 rounded-full bg-border">
            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${proofScore}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Projects</p>
          <p className="mt-1 text-2xl font-semibold">{projects.length}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">Cap: 10 production-grade projects</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Connected tools</p>
          <p className="mt-1 text-2xl font-semibold">{integrationConnections.length}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {integrationConnections.length ? integrationConnections.map((item) => item.provider).join(", ") : "No integrations connected yet."}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Score Snapshot</p>
            <p className="text-xs text-muted-foreground">
              {latestProofSnapshot
                ? `Latest persisted proof snapshot: ${latestProofSnapshot.score} (${latestProofSnapshot.label ?? "n/a"}) at ${new Date(latestProofSnapshot.computedAt).toLocaleString()}`
                : "No persisted proof snapshot yet."}
            </p>
          </div>
          <form action={recomputeBuilderScoreAction}>
            <input type="hidden" name="scope" value="builder" />
            <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
              Recompute proof snapshot
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-cyan-300" />
            <p className="text-sm font-semibold">Project Portfolio</p>
          </div>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects added yet. Add production projects from Builder Projects.</p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <article key={project.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{project.title}</p>
                    {project.githubUrl ? (
                      <a href={project.githubUrl} className="inline-flex items-center gap-1 text-xs text-cyan-300" target="_blank" rel="noreferrer">
                        <Github className="h-3.5 w-3.5" /> GitHub
                      </a>
                    ) : null}
                  </div>
                  {project.tagline ? <p className="mt-1 text-xs text-muted-foreground">{project.tagline}</p> : null}
                </article>
              ))}
            </div>
          )}
          <Link href="/app/builder-projects" className="mt-3 inline-flex text-xs text-cyan-300">
            Open full project manager
          </Link>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-300" />
            <p className="text-sm font-semibold">Resume & Cover Letter</p>
          </div>
          <form action={saveResumeAction} className="space-y-2">
            <input name="fileUrl" placeholder="Resume file URL" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required />
            <input name="fileName" placeholder="Resume file name" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
              Save resume
            </button>
          </form>
          <form action={saveCoverLetterAction} className="mt-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-3">
              <input name="targetRoleType" placeholder="Target role" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input name="opportunityType" placeholder="Opportunity type" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input name="companyName" placeholder="Company" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <textarea name="content" rows={4} placeholder="Cover letter draft content..." className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required />
            <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
              Save cover letter draft
            </button>
          </form>
          <div className="mt-3 space-y-2">
            {coverLetters.length === 0 ? (
              <p className="text-xs text-muted-foreground">No cover letter drafts saved.</p>
            ) : (
              coverLetters.map((draft) => (
                <p key={draft.id} className="rounded-md border border-border/60 px-2 py-1 text-xs text-muted-foreground">
                  {draft.targetRoleType ?? "Role"} | {draft.opportunityType ?? "Opportunity"} | {new Date(draft.createdAt).toLocaleDateString()}
                </p>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <p className="text-sm font-semibold">Mini Apps / Web3 Project Links</p>
          </div>
          <form action={saveMiniAppAction} className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <select name="platform" className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="BASE">Base</option>
                <option value="FARCASTER">Farcaster</option>
                <option value="OTHER">Other</option>
              </select>
              <input name="chain" placeholder="Chain" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <input name="sourceUrl" placeholder="Mini app URL" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required />
            <input name="manifestUrl" placeholder="Manifest URL (/.well-known/farcaster.json)" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <input name="appName" placeholder="App name" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
              Add mini app
            </button>
          </form>
          <div className="mt-3 space-y-2">
            {miniApps.length === 0 ? (
              <p className="text-xs text-muted-foreground">No mini apps linked.</p>
            ) : (
              miniApps.map((miniApp) => (
                <div key={miniApp.id} className="rounded-md border border-border/60 p-2">
                  <p className="text-xs font-medium">{miniApp.appName ?? miniApp.sourceUrl}</p>
                  <p className="text-[11px] text-muted-foreground">{miniApp.platform} | {miniApp.chain ?? "Unspecified chain"}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-300" />
            <p className="text-sm font-semibold">GitHub & Wallet Signal</p>
          </div>
          <div className="space-y-2">
            <p className="rounded-md border border-border/60 px-3 py-2 text-xs text-muted-foreground">
              GitHub: {githubConnection?.username ? `Connected as ${githubConnection.username}` : "Not connected"}
            </p>
            <p className="rounded-md border border-border/60 px-3 py-2 text-xs text-muted-foreground">
              Wallets linked: {walletCount}
            </p>
          </div>
          <Link href="/app/settings" className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-300">
            <Wallet className="h-3.5 w-3.5" /> Open integrations and wallet settings
          </Link>
        </div>
      </section>
    </div>
  );
}
