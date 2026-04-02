import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowRight, Github, Trash2 } from "lucide-react";
import { db } from "@/server/db/client";
import { deleteBuilderProject, upsertBuilderProject } from "@/app/actions/builder-projects";
import { BuilderProjectManager } from "@/components/app/BuilderProjectManager";

export const metadata = { title: "Builder Projects - Webcoin Labs" };

export default async function BuilderProjectsPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  if (!["BUILDER", "ADMIN"].includes(session.user.role)) redirect("/app");

  const projects = await db.builderProject.findMany({
    where: session.user.role === "ADMIN" ? undefined : { builderId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  const githubConnection = await db.githubConnection.findUnique({
    where: { userId: session.user.id },
    select: { username: true, profileUrl: true },
  });

  const saveProjectAction = async (formData: FormData) => {
    "use server";
    return await upsertBuilderProject(formData);
  };
  const deleteProjectAction = async (formData: FormData) => {
    "use server";
    await deleteBuilderProject(String(formData.get("projectId") ?? ""));
  };

  return (
    <div className="space-y-6 py-8">
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="text-2xl font-bold">Builder Portfolio Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add unlimited projects with proof of execution: repo links, demos, open-source impact, and outcomes.
        </p>
      </section>

      <BuilderProjectManager githubConnection={githubConnection} saveAction={saveProjectAction} />

      <section className="space-y-3">
        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-8 text-sm text-muted-foreground">
            No builder projects yet.
          </div>
        ) : (
          projects.map((project) => (
            <article key={project.id} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{project.title}</h3>
                  {project.tagline ? <p className="mt-1 text-xs text-muted-foreground">{project.tagline}</p> : null}
                </div>
                <form action={deleteProjectAction}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <button type="submit" className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </form>
              </div>

              {project.description ? <p className="mt-2 text-sm text-muted-foreground">{project.description}</p> : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {project.techStack.map((item) => (
                  <span key={item} className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                {project.githubUrl ? (
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-300">
                    <Github className="h-3.5 w-3.5" /> GitHub
                  </a>
                ) : null}
                {project.liveUrl ? (
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-300">
                    Live demo <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
              {project.achievements ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium text-amber-200">Achievements:</span> {project.achievements}
                </p>
              ) : null}
              {project.openSourceContributions ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium text-emerald-200">Open source:</span> {project.openSourceContributions}
                </p>
              ) : null}
            </article>
          ))
        )}
      </section>
    </div>
  );
}

