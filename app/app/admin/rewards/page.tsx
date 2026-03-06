import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { AdminRewardsForm } from "@/components/app/AdminRewardsForm";

export const metadata = { title: "Rewards — Admin | Webcoin Labs" };

export default async function AdminRewardsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/app");

  const [users, rewards] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.reward.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-8 py-8">
      <Link href="/app/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>
      <h1 className="text-2xl font-bold">Rewards / Credits</h1>
      <p className="text-muted-foreground text-sm">Create pending rewards for users (internal credits; no on-chain transfer). Primary binding is userId; optional Telegram handle for reference.</p>

      <AdminRewardsForm users={users} />

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent rewards</h2>
        {rewards.length === 0 ? (
          <p className="text-sm text-muted-foreground">None yet.</p>
        ) : (
          <div className="space-y-3">
            {rewards.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-border/50 bg-card flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{r.label} — {r.amountText}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.user?.name ?? r.user?.email ?? "Unknown"} {r.externalHandle && `· @${r.externalHandle}`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${r.status === "PENDING" ? "bg-amber-500/10 text-amber-400" : "bg-muted"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
