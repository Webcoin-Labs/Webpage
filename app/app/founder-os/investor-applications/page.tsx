import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Crown, Send } from "lucide-react";
import { db } from "@/server/db/client";
import { submitInvestorApplication } from "@/app/actions/webcoin-os";

export const metadata = { title: "Founder OS Investor Applications - Webcoin Labs" };

function cycleLabel(start: Date, end: Date) {
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

export default async function FounderInvestorApplicationsPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  if (!["FOUNDER", "ADMIN"].includes(session.user.role)) redirect("/app");

  const [ventures, pitchDecks, investors, quota, subscription, myApplications] = await Promise.all([
    db.venture.findMany({
      where: session.user.role === "ADMIN" ? undefined : { ownerUserId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    db.pitchDeck.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.investorProfile.findMany({
      where: { isPublic: true },
      include: {
        user: { select: { id: true, name: true, username: true } },
        company: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    db.founderInvestorRequestQuota.findUnique({ where: { userId: session.user.id } }),
    db.premiumSubscription.findUnique({ where: { userId: session.user.id } }),
    db.investorApplication.findMany({
      where: { founderUserId: session.user.id },
      include: {
        venture: { select: { id: true, name: true } },
        investor: { select: { id: true, name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const submitAction = async (formData: FormData) => {
    "use server";
    await submitInvestorApplication(formData);
  };

  return (
    <div className="space-y-6 py-8">
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="text-2xl font-semibold">Investor Discovery & Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send venture applications with deck attachments through quota-aware premium logic.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Current tier</p>
          <p className="mt-1 text-2xl font-semibold">{subscription?.tier ?? "FREE"}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Applications sent this cycle</p>
          <p className="mt-1 text-2xl font-semibold">
            {quota?.sentCount ?? 0} / {quota?.limitCount ?? (subscription?.tier === "PREMIUM" ? 10 : 3)}
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {quota ? cycleLabel(quota.cycleStart, quota.cycleEnd) : "Cycle starts on first send"}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Premium utility</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Free: up to 3 investor applications per cycle. Premium: up to 10 with deeper recommendations.
          </p>
          {subscription?.tier !== "PREMIUM" ? (
            <Link href="/app/kols-premium" className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-300">
              <Crown className="h-3.5 w-3.5" /> Explore Premium
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="mb-3 text-sm font-semibold">Send Application</p>
          <form action={submitAction} className="space-y-2">
            <select name="ventureId" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required>
              <option value="">Choose venture</option>
              {ventures.map((venture) => (
                <option key={venture.id} value={venture.id}>
                  {venture.name}
                </option>
              ))}
            </select>
            <select name="pitchDeckId" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="">No deck attached</option>
              {pitchDecks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.originalFileName}
                </option>
              ))}
            </select>
            <select name="investorUserId" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required>
              <option value="">Choose investor</option>
              {investors.map((investor) => (
                <option key={investor.userId} value={investor.userId}>
                  {investor.user.name ?? investor.user.username ?? "Investor"} | {investor.company?.name ?? investor.firmName ?? "Independent"}
                </option>
              ))}
            </select>
            <textarea name="note" rows={4} placeholder="Application note" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <button type="submit" className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
              <Send className="h-3.5 w-3.5" /> Send investor application
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="mb-3 text-sm font-semibold">Recent Applications</p>
          {myApplications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No investor applications sent yet.</p>
          ) : (
            <div className="space-y-2">
              {myApplications.map((application) => (
                <div key={application.id} className="rounded-md border border-border/60 p-2">
                  <p className="text-xs font-medium">
                    {application.venture.name} → {application.investor.name ?? application.investor.username ?? "Investor"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {application.status} | {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

