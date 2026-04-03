import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db/client";
import { redeemProjectAdvisorInvite, upsertAdvisorProfile } from "@/app/actions/advisor";

export const metadata = { title: "Advisor Profile - Webcoin Labs" };

export default async function AdvisorPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");

  const [grant, profile, projectConnections] = await Promise.all([
    db.advisorAccessGrant.findUnique({
      where: { userId: session.user.id },
      include: {
        sourceInvite: { include: { project: { select: { id: true, name: true } } } },
      },
    }),
    db.advisorProfile.findUnique({
      where: { userId: session.user.id },
    }),
    db.projectAdvisorConnection.findMany({
      where: { advisorProfile: { userId: session.user.id } },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const redeemInviteAction = async (formData: FormData) => {
    "use server";
    const token = String(formData.get("token") ?? "");
    await redeemProjectAdvisorInvite(token);
  };

  const saveAdvisorProfileAction = async (formData: FormData) => {
    "use server";
    await upsertAdvisorProfile(formData);
  };

  return (
    <div className="space-y-6 py-8">
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="text-2xl font-bold">Advisor Workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Advisor profiles are enabled only after redeeming an admin invite link.
        </p>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-sm font-semibold">Redeem advisor invite link</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Ask admin for an invite link to unlock advisor profile creation and project access.
        </p>
        <form action={redeemInviteAction} className="mt-3 flex gap-2">
          <input name="token" placeholder="ADV-XXXXXXXX" required className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm uppercase" />
          <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
            Redeem
          </button>
        </form>
        {grant?.sourceInvite?.project ? (
          <p className="mt-2 text-xs text-emerald-300">Invite active for project: {grant.sourceInvite.project.name}</p>
        ) : (
          <p className="mt-2 text-xs text-amber-300">No advisor access granted yet.</p>
        )}
      </section>

      {!grant ? (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          Advisor profile is locked. Redeem an admin invite first.
        </section>
      ) : (
        <section className="rounded-xl border border-border/60 bg-card p-5">
          <h2 className="text-sm font-semibold">Advisor profile</h2>
          <form action={saveAdvisorProfileAction} className="mt-3 space-y-3">
            <input
              name="headline"
              defaultValue={profile?.headline ?? ""}
              placeholder="Headline (e.g. Growth Advisor for Web3 SaaS)"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              required
            />
            <textarea
              name="bio"
              rows={4}
              defaultValue={profile?.bio ?? ""}
              placeholder="Your advisory background"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              required
            />
            <div className="grid gap-2 md:grid-cols-2">
              <input
                name="expertise"
                defaultValue={(profile?.expertise ?? []).join(", ")}
                placeholder="Expertise (comma separated)"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                required
              />
              <input
                name="hourlyRateUsd"
                type="number"
                min={0}
                defaultValue={profile?.hourlyRateUsd ?? ""}
                placeholder="Hourly rate (USD)"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <input name="companyName" defaultValue={profile?.companyName ?? ""} placeholder="Company (optional)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input name="website" defaultValue={profile?.website ?? ""} placeholder="Website (optional)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <input name="linkedin" defaultValue={profile?.linkedin ?? ""} placeholder="LinkedIn URL (optional)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input name="telegram" defaultValue={profile?.telegram ?? ""} placeholder="Telegram (optional)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                name="publicVisible"
                value="true"
                defaultChecked={profile?.publicVisible ?? true}
                className="accent-cyan-500"
              />
              Visible to founders in advisor directory
            </label>
            <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
              Save advisor profile
            </button>
          </form>
        </section>
      )}

      <section className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-sm font-semibold">Connected projects</h2>
        {projectConnections.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No project connections yet.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {projectConnections.map((connection) => (
              <p key={connection.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                {connection.project.name}
              </p>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

