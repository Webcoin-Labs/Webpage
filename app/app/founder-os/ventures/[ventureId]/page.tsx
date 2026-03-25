import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";

export const metadata = { title: "Venture Workspace - Founder OS" };

export default async function FounderVentureWorkspace({
  params,
}: {
  params: Promise<{ ventureId: string }>;
}) {
  const { ventureId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!["FOUNDER", "BUILDER", "ADMIN"].includes(session.user.role)) redirect("/app");

  const venture = await db.venture.findFirst({
    where: { id: ventureId, ownerUserId: session.user.id },
    include: {
      raiseRounds: {
        where: { isActive: true },
        orderBy: { updatedAt: "desc" },
        take: 3,
      },
      tokenomicsModels: {
        orderBy: { updatedAt: "desc" },
        take: 3,
      },
    },
  });

  if (!venture) notFound();

  return (
    <div className="space-y-4 py-6">
      <section className="rounded-xl border border-border/60 bg-card p-4">
        <h1 className="text-xl font-semibold">{venture.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Venture workspace with linked fundraising and tokenomics context.
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Active rounds</p>
          {venture.raiseRounds.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No active rounds.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {venture.raiseRounds.map((round) => (
                <p key={round.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                  {round.roundName} · {round.status}
                </p>
              ))}
            </div>
          )}
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Tokenomics models</p>
          {venture.tokenomicsModels.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No tokenomics models linked.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {venture.tokenomicsModels.map((model) => (
                <p key={model.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                  {model.name} ({model.tokenSymbol ?? "TOKEN"})
                </p>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

