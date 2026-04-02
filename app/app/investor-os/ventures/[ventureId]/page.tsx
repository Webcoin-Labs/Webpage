import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { getStartupHubDetailByVentureId } from "@/lib/startup-hub";

export const metadata = { title: "Venture Detail - Investor OS" };

export default async function InvestorVentureDetailPage({
  params,
}: {
  params: Promise<{ ventureId: string }>;
}) {
  const { ventureId } = await params;
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  if (!["INVESTOR", "ADMIN"].includes(session.user.role)) redirect("/app");

  const detail = await getStartupHubDetailByVentureId(ventureId);
  if (!detail || !detail.venture.isPublic) notFound();
  const { venture, startup } = detail;

  return (
    <div className="space-y-4 py-6">
      <section className="rounded-xl border border-border/60 bg-card p-4">
        <h1 className="text-xl font-semibold">{venture.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {venture.stage ?? "Stage not set"} - {venture.chainEcosystem ?? "Chain not set"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-border/60 px-2.5 py-1 text-muted-foreground">
            {venture.isPublic ? "Public venture" : "Private venture"}
          </span>
          <span className="rounded-full border border-border/60 px-2.5 py-1 text-muted-foreground">
            Active rounds: {venture.raiseRounds.length}
          </span>
          {startup?.card.ratingAverage ? (
            <span className="rounded-full border border-border/60 px-2.5 py-1 text-muted-foreground">
              Rating {startup.card.ratingAverage.toFixed(1)} ({startup.card.ratingCount})
            </span>
          ) : null}
        </div>
      </section>

      {startup ? (
        <section className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Linked startup profile</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {startup.card.name} - {startup.card.tagline ?? "No tagline"}
          </p>
          {startup.description ? <p className="mt-2 text-sm text-muted-foreground">{startup.description}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`/startups/${startup.card.slugOrId}`}
              className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200"
            >
              Open startup page
            </a>
            {startup.startupLinks.pitchDeckUrl ? (
              <a
                href={startup.startupLinks.pitchDeckUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Deck
              </a>
            ) : null}
            {startup.startupLinks.githubRepo ? (
              <a
                href={startup.startupLinks.githubRepo}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Repo
              </a>
            ) : null}
            {startup.startupLinks.website ? (
              <a
                href={startup.startupLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Website
              </a>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm text-muted-foreground">No linked startup profile yet.</p>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Active rounds</p>
          {venture.raiseRounds.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No active rounds visible.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {venture.raiseRounds.map((round) => (
                <div key={round.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                  <p>
                    {round.roundName} - {round.status}
                  </p>
                  <p className="mt-1 text-xs">
                    {round.currency} {Number(round.targetAmount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Investor actions</p>
          <div className="mt-2 grid gap-2">
            <Link
              href="/app/investor-os/diligence"
              className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Create diligence memo
            </Link>
            <Link
              href="/app/investor-os/deal-flow"
              className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Back to deal flow
            </Link>
            <Link
              href="/app/investor-os/ventures"
              className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Back to startup discovery
            </Link>
          </div>
        </article>
      </section>

      {startup?.ratings.length ? (
        <section className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Recent ratings</p>
          <div className="mt-2 space-y-2">
            {startup.ratings.slice(0, 5).map((rating, index) => (
              <p key={`${rating.reviewerName}-${index}`} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                {rating.reviewerName} - {rating.score}
                {rating.note ? ` - ${rating.note}` : ""}
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
