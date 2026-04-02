import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";

export const metadata = { title: "Venture Workspace - Founder OS" };

export default async function FounderVentureWorkspace({
  params,
}: {
  params: Promise<{ ventureId: string }>;
}) {
  const { ventureId } = await params;
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  if (!["FOUNDER", "ADMIN"].includes(session.user.role)) redirect("/app");

  const venture = await db.venture.findFirst({
    where: session.user.role === "ADMIN" ? { id: ventureId } : { id: ventureId, ownerUserId: session.user.id },
    include: {
      raiseRounds: {
        where: { isActive: true },
        orderBy: { updatedAt: "desc" },
        take: 6,
      },
      tokenomicsModels: {
        orderBy: { updatedAt: "desc" },
        take: 6,
      },
    },
  });

  if (!venture) notFound();

  return (
    <div className="space-y-4 py-6">
      <section className="rounded-xl border border-border/60 bg-card p-4">
        <h1 className="text-xl font-semibold">{venture.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Venture workspace with linked fundraising, tokenomics, and investor-readiness context.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-border/60 px-2.5 py-1 text-muted-foreground">
            {venture.stage ?? "Stage not set"}
          </span>
          <span className="rounded-full border border-border/60 px-2.5 py-1 text-muted-foreground">
            {venture.chainEcosystem ?? "Chain not set"}
          </span>
          <span className="rounded-full border border-border/60 px-2.5 py-1 text-muted-foreground">
            {venture.isPublic ? "Public venture" : "Private venture"}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Active rounds</p>
          {venture.raiseRounds.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No active rounds.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {venture.raiseRounds.map((round) => (
                <div key={round.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                  <p>
                    {round.roundName} - {round.status}
                  </p>
                  <p className="mt-1 text-xs">
                    {round.currency} {Number(round.targetAmount)} target
                  </p>
                </div>
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

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">Workspace actions</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/app/founder-os/pitch-deck"
            className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Open Pitch Deck
          </Link>
          <Link
            href="/app/founder-os/tokenomics"
            className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Open Tokenomics
          </Link>
          <Link
            href="/app/founder-os/investor-connect"
            className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Open Investor Connect
          </Link>
          <Link
            href="/app/founder-os/ventures"
            className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Back to Startup Layer
          </Link>
        </div>
      </section>
    </div>
  );
}
