import { getServerSession } from "next-auth";
import Link from "next/link";
import { ArrowRight, Handshake, Sparkles } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getRecommendedBuildersForFounder, getRecommendedProjectsForBuilder } from "@/lib/recommendations";
import { getBuilderAffiliation, getFounderAffiliation } from "@/lib/affiliation";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";

export const metadata = { title: "Find Co-founder — Webcoin Labs" };

export default async function MatchesPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user;
  const isFounder = user.role === "FOUNDER" || user.role === "ADMIN";
  const isBuilder = user.role === "BUILDER" || user.role === "ADMIN";

  const [founderMatches, builderMatches] = await Promise.all([
    isFounder ? getRecommendedBuildersForFounder(user.id, 24) : Promise.resolve([]),
    isBuilder ? getRecommendedProjectsForBuilder(user.id, 24) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-cyan-300" />
            <h1 className="text-2xl font-bold">Find Co-founder</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Match founders and builders based on skills, chain focus, and collaboration intent.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/builders"
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent/50"
          >
            Browse builders <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent/50"
          >
            Browse projects <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/app/intros/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-500"
          >
            Request an intro <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {isFounder ? (
        <section className="rounded-2xl border border-border/50 bg-card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              <p className="text-sm font-medium">Recommended builders</p>
            </div>
            <Link href="/builders" className="text-xs text-blue-300">
              See all builders
            </Link>
          </div>

          {founderMatches.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-background p-5">
              <p className="text-sm font-medium">No matches yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Fill out your founder profile (chain focus, needs, description) to unlock stronger co-founder recommendations.
              </p>
              <Link href="/app/profile" className="mt-3 inline-flex items-center gap-2 text-sm text-blue-300">
                Update profile <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {founderMatches.map((match) => {
                const affiliation = getBuilderAffiliation(match.builder);
                const builderHref = `/builders/${match.builder.handle ?? match.builder.user.id}`;
                return (
                  <div key={match.builder.id} className="rounded-xl border border-border/50 bg-background p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <ProfileAvatar
                        src={match.builder.user.image}
                        alt={match.builder.user.name ?? "Builder"}
                        fallback={(match.builder.user.name ?? "B").charAt(0)}
                        className="h-8 w-8 rounded-full border border-border/60"
                        fallbackClassName="bg-cyan-500/10 text-xs text-cyan-300"
                      />
                      <p className="text-sm font-semibold">{match.builder.user.name ?? "Builder"}</p>
                      <ProfileAffiliationTag label={affiliation.label} variant={affiliation.variant} />
                      <span className="ml-auto rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">
                        {match.match.score}% match
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{match.match.reasons.join(" | ")}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      <Link href={builderHref} className="text-blue-300 hover:text-blue-200">
                        View builder <ArrowRight className="inline h-3 w-3" />
                      </Link>
                      <Link href="/app/intros/new" className="text-cyan-300 hover:text-cyan-200">
                        Request intro <ArrowRight className="inline h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {isBuilder ? (
        <section className="rounded-2xl border border-border/50 bg-card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <p className="text-sm font-medium">Recommended projects</p>
            </div>
            <Link href="/projects" className="text-xs text-blue-300">
              See all projects
            </Link>
          </div>

          {builderMatches.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-background p-5">
              <p className="text-sm font-medium">No matches yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Fill out your builder profile (skills, preferred chains, open to) to unlock stronger co-founder matches.
              </p>
              <Link href="/app/profile" className="mt-3 inline-flex items-center gap-2 text-sm text-blue-300">
                Update profile <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {builderMatches.map((match) => {
                const founderTag = getFounderAffiliation(match.project.owner.founderProfile);
                const projectHref = `/projects/${match.project.slug ?? match.project.id}`;
                return (
                  <div key={match.project.id} className="rounded-xl border border-border/50 bg-background p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{match.project.name}</p>
                      <span className="ml-auto rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">
                        {match.match.score}% match
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{match.project.owner.name ?? "Founder"}</span>
                      {founderTag ? <ProfileAffiliationTag label={founderTag.label} variant="founder" /> : null}
                      {match.project.owner.founderProfile?.isHiring ? (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
                          Hiring
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{match.match.reasons.join(" | ")}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      <Link href={projectHref} className="text-blue-300 hover:text-blue-200">
                        View project <ArrowRight className="inline h-3 w-3" />
                      </Link>
                      <Link href="/app/intros/new" className="text-cyan-300 hover:text-cyan-200">
                        Request intro <ArrowRight className="inline h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

