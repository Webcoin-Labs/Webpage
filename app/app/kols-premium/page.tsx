import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Crown, ArrowRight, Megaphone } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "KOL Premium - Webcoin Labs" };

type KolPayload = {
  category?: string;
  budgetRange?: string;
  campaignGoal?: string;
  priorityTier?: "STANDARD" | "PREMIUM";
  targetRegion?: string;
  targetKolCount?: number;
  timelineDays?: number;
};

function asKolPayload(value: unknown): KolPayload {
  if (!value || typeof value !== "object") return {};
  return value as KolPayload;
}

export default async function KolsPremiumPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!["FOUNDER", "ADMIN"].includes(session.user.role)) redirect("/app");

  const baseWhere =
    session.user.role === "ADMIN"
      ? { type: "KOL" as const }
      : { founderId: session.user.id, type: "KOL" as const };

  const [requests, total, matched, reviewing] = await Promise.all([
    prisma.introRequest.findMany({
      where: baseWhere,
      include: {
        founder: { select: { name: true, email: true } },
        sourceProject: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 120,
    }),
    prisma.introRequest.count({ where: baseWhere }),
    prisma.introRequest.count({ where: { ...baseWhere, status: "MATCHED" } }),
    prisma.introRequest.count({ where: { ...baseWhere, status: "REVIEWING" } }),
  ]);

  const premiumCount = requests.filter((item) => asKolPayload(item.requestPayload).priorityTier === "PREMIUM").length;

  return (
    <div className="space-y-8 py-8">
      <div className="rounded-2xl border border-border/50 bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
              <Crown className="h-3.5 w-3.5" />
              KOL Premium
            </div>
            <h1 className="text-2xl font-bold">KOL Campaign Pipeline</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track KOL intro requests, premium routing, and matching progress in one workspace.
            </p>
          </div>
          <Link
            href="/app/intros/new?type=KOL&tier=PREMIUM"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            New Premium Request <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs text-muted-foreground">Total KOL Requests</p>
          <p className="mt-1 text-2xl font-semibold">{total}</p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-card p-4">
          <p className="text-xs text-muted-foreground">Premium Tier</p>
          <p className="mt-1 text-2xl font-semibold text-amber-300">{premiumCount}</p>
        </div>
        <div className="rounded-xl border border-cyan-500/30 bg-card p-4">
          <p className="text-xs text-muted-foreground">Reviewing</p>
          <p className="mt-1 text-2xl font-semibold text-cyan-300">{reviewing}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-card p-4">
          <p className="text-xs text-muted-foreground">Matched</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-300">{matched}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-border/50 bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Request Queue</h2>
          <Link href="/app/intros" className="text-xs text-cyan-300 hover:text-cyan-200">
            Open full intros board
          </Link>
        </div>
        {requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-10 text-center">
            <Megaphone className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No KOL requests yet. Create your first premium campaign request.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((item) => {
              const payload = asKolPayload(item.requestPayload);
              const tier = payload.priorityTier === "PREMIUM" ? "PREMIUM" : "STANDARD";
              return (
                <div key={item.id} className="rounded-xl border border-border/50 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{payload.category || "KOL request"}</p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${
                            tier === "PREMIUM"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {tier}
                        </span>
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {session.user.role === "ADMIN"
                          ? `${item.founder.name ?? item.founder.email ?? "Founder"}`
                          : `${item.sourceProject?.name ? `Project: ${item.sourceProject.name}` : "No linked project"}`}{" "}
                        | Budget: {payload.budgetRange || "N/A"}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {payload.campaignGoal || item.contextSummary || "No campaign goal provided."}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Region: {payload.targetRegion || "Global"}</p>
                      <p>KOL target: {payload.targetKolCount ?? "N/A"}</p>
                      <p>Timeline: {payload.timelineDays ? `${payload.timelineDays} days` : "N/A"}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
