import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AlertTriangle, Shield } from "lucide-react";
import { db } from "@/server/db/client";
import { redeemInviteOnlyCode } from "@/app/actions/invite-community";

export const metadata = { title: "Invite-Only Community - Webcoin Labs" };

export default async function InviteCommunityPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");

  const membership = await db.inviteOnlyMembership.findUnique({
    where: { userId: session.user.id },
    include: { code: { select: { code: true, label: true } } },
  });

  const redeemAction = async (formData: FormData) => {
    "use server";
    await redeemInviteOnlyCode(formData);
  };

  return (
    <div className="space-y-6 py-8">
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
          <Shield className="h-3.5 w-3.5" />
          Invite-Only Community Beta
        </div>
        <h1 className="text-2xl font-bold">Invite-Only Community Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This dashboard is in beta. Most advanced modules are still under active build and may not be fully functional yet.
        </p>
      </section>

      {!membership ? (
        <section className="rounded-xl border border-border/60 bg-card p-6">
          <p className="text-sm font-medium">Enter invite code</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Use the code provided by admin to unlock invite-only community access.
          </p>
          <form action={redeemAction} className="mt-4 flex flex-wrap gap-2">
            <input
              name="code"
              placeholder="WCL-XXXXYYYY"
              className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm uppercase"
              required
            />
            <button type="submit" className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200">
              Redeem
            </button>
          </form>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
            Invite access enabled via code <strong>{membership.code.code}</strong>.
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <p className="text-sm font-semibold">Planned invite-only modules</p>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
              <span className="rounded-md border border-border/60 px-2 py-1">Allocation tracking (beta)</span>
              <span className="rounded-md border border-border/60 px-2 py-1">Private investor discovery (beta)</span>
              <span className="rounded-md border border-border/60 px-2 py-1">Community manager profiles (beta)</span>
              <span className="rounded-md border border-border/60 px-2 py-1">Premium intros and exclusive rooms (beta)</span>
            </div>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-100">
            <div className="inline-flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              This area is intentionally limited while we ship core beta features.
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

