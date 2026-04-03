import Link from "next/link";
import { Star } from "lucide-react";
import { listStartupHubCards } from "@/lib/startup-hub";

export const metadata = {
  title: "Startups - Webcoin Labs",
};

export default async function StartupsDirectoryPage() {
  const startups = await listStartupHubCards({ take: 60 });

  return (
    <div className="min-h-screen pt-24">
      <section className="container mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Startup Directory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Public startup pages from the Founder OS workspace.
        </p>
        <div className="mt-4 space-y-3">
          {startups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No startups published yet.</p>
          ) : (
            startups.map((startup) => (
              <Link
                key={startup.startupId}
                href={`/startups/${startup.slugOrId}`}
                className="block rounded-lg border border-border/50 bg-card p-4 transition-colors hover:border-cyan-500/40"
              >
                <p className="font-medium">{startup.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {startup.tagline ?? "No tagline"} | {startup.stage ?? "Stage not set"} | {startup.chain ?? "Chain not set"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Founder: {startup.founderName} {startup.founderRoleTitle ? `| ${startup.founderRoleTitle}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{startup.ventureId ? "Venture-linked" : "Startup-only"}</span>
                  <span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-300" />
                      {startup.ratingAverage !== null ? startup.ratingAverage.toFixed(1) : "Not rated"}
                    </span>
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
