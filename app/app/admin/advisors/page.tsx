import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db/client";
import { createProjectAdvisorInvite } from "@/app/actions/advisor";

export const metadata = { title: "Admin Advisors - Webcoin Labs" };

export default async function AdminAdvisorsPage() {
  const session = await getServerSession();
  if (session?.user.role !== "ADMIN") redirect("/app");

  const [projects, invites] = await Promise.all([
    db.project.findMany({
      orderBy: { updatedAt: "desc" },
      take: 120,
      select: {
        id: true,
        name: true,
        owner: { select: { name: true, email: true } },
      },
    }),
    db.projectAdvisorInvite.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        project: { select: { name: true } },
        usedByUser: { select: { name: true, email: true } },
      },
    }),
  ]);

  const createInviteAction = async (formData: FormData) => {
    "use server";
    await createProjectAdvisorInvite(formData);
  };

  return (
    <div className="space-y-6 py-8">
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="text-2xl font-bold">Advisor Invites</h1>
        <p className="mt-1 text-sm text-muted-foreground">Generate advisor invite links for specific founder projects.</p>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-sm font-semibold">Create project advisor invite</h2>
        <form action={createInviteAction} className="mt-3 space-y-3">
          <select name="projectId" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required>
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.owner.name ?? project.owner.email ?? "Founder"})
              </option>
            ))}
          </select>
          <input name="expiresAt" type="datetime-local" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
          <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200">
            Generate invite link
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-sm font-semibold">Recent advisor invites</h2>
        <div className="mt-3 space-y-2">
          {invites.length === 0 ? (
            <p className="text-sm text-muted-foreground">No advisor invites yet.</p>
          ) : (
            invites.map((invite) => (
              <div key={invite.id} className="rounded-md border border-border/50 p-3">
                <p className="text-sm font-medium">{invite.project.name}</p>
                <p className="text-xs text-muted-foreground">Token: {invite.token}</p>
                <p className="text-xs text-muted-foreground">Link: /advisor/invite/{invite.token}</p>
                <p className="text-xs text-muted-foreground">
                  Active: {invite.isActive ? "Yes" : "No"} | Redeemed: {invite.redeemedCount}/{invite.maxRedemptions}
                </p>
                {invite.usedByUser ? (
                  <p className="text-xs text-muted-foreground">Redeemed by: {invite.usedByUser.name ?? invite.usedByUser.email}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

