import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";

export const metadata = { title: "Venture Detail - Investor OS" };

export default async function InvestorVentureDetailPage({
  params,
}: {
  params: Promise<{ ventureId: string }>;
}) {
  const { ventureId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!["INVESTOR", "ADMIN"].includes(session.user.role)) redirect("/app");

  const venture = await db.venture.findUnique({
    where: { id: ventureId },
    include: {
      raiseRounds: {
        where: { isActive: true },
        orderBy: { updatedAt: "desc" },
        take: 3,
      },
    },
  });
  if (!venture || !venture.isPublic) notFound();

  return (
    <div className="space-y-4 py-6">
      <section className="rounded-xl border border-border/60 bg-card p-4">
        <h1 className="text-xl font-semibold">{venture.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {venture.stage ?? "Stage not set"} · {venture.chainEcosystem ?? "Chain not set"}
        </p>
      </section>
      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">Active rounds</p>
        {venture.raiseRounds.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No active rounds visible.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {venture.raiseRounds.map((round) => (
              <p key={round.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                {round.roundName} · {round.status} · {round.currency} {Number(round.targetAmount)}
              </p>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

