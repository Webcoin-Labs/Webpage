import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";

export const metadata = { title: "Project Workspace - Builder OS" };

export default async function BuilderProjectWorkspace({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!["BUILDER", "FOUNDER", "ADMIN"].includes(session.user.role)) redirect("/app");

  const project = await db.builderProject.findFirst({
    where: { id: projectId, builderId: session.user.id },
  });
  if (!project) notFound();

  return (
    <div className="space-y-4 py-6">
      <section className="rounded-xl border border-border/60 bg-card p-4">
        <h1 className="text-xl font-semibold">{project.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{project.tagline ?? "No tagline added yet."}</p>
      </section>
      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">Project details</p>
        <div className="mt-2 space-y-2 text-sm text-muted-foreground">
          <p>Tech stack: {project.techStack.length ? project.techStack.join(", ") : "Not set"}</p>
          <p>Description: {project.description ?? "Not set"}</p>
          <p>GitHub: {project.githubUrl ?? "Not linked"}</p>
          <p>Live URL: {project.liveUrl ?? "Not linked"}</p>
        </div>
      </section>
    </div>
  );
}

