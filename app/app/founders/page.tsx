import { getServerSession } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, Linkedin, Twitter } from "lucide-react";
import { db } from "@/server/db/client";
import { CompanyLogo } from "@/components/common/CompanyLogo";
import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";
import { CopyLinkButton } from "@/components/common/CopyLinkButton";
import { StartupRatingForm } from "@/components/founders/StartupRatingForm";

export const metadata = { title: "Founders - Webcoin Labs" };

function normalizeExternalLink(value: string | null | undefined, kind: "x" | "url" = "url") {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (kind === "x") {
    return `https://x.com/${trimmed.replace(/^@+/, "")}`;
  }
  return `https://${trimmed}`;
}

export default async function FoundersPage({
  searchParams,
}: {
  searchParams?: Promise<{ stage?: string; chain?: string; hiring?: string }>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  const canRateStartups = session.user.role === "FOUNDER" || session.user.role === "ADMIN";
  const stageFilter = resolvedSearchParams?.stage?.trim() || "";
  const chainFilter = resolvedSearchParams?.chain?.trim() || "";
  const hiringOnly = resolvedSearchParams?.hiring === "1";
  const currentBuilderProfile =
    session.user.role === "BUILDER" || session.user.role === "FOUNDER" || session.user.role === "ADMIN"
      ? await db.builderProfile.findUnique({
          where: { userId: session.user.id },
          select: { skills: true, stack: true, chainExpertise: true },
        })
      : null;

  const founders = await db.user.findMany({
    where: {
      founderProfile: {
        is: {
          publicVisible: true,
          ...(hiringOnly ? { isHiring: true } : {}),
        },
      },
      startups: {
        some: {
          ...(stageFilter ? { stage: stageFilter as any } : {}),
          ...(chainFilter ? { chainFocus: chainFilter as any } : {}),
        },
      },
    },
    select: {
      id: true,
      name: true,
      founderProfile: {
        select: {
          companyName: true,
          companyLogoUrl: true,
          roleTitle: true,
          twitter: true,
          linkedin: true,
          website: true,
          publicVisible: true,
          isHiring: true,
          currentNeeds: true,
        },
      },
      startups: {
        select: {
          id: true,
          name: true,
          slug: true,
          tagline: true,
          stage: true,
          chainFocus: true,
          traction: true,
          revenue: true,
          usersCount: true,
          ratings: {
            select: {
              score: true,
              reviewerId: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 4,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 60,
  });

  const appUrl = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");

  return (
    <div className="space-y-6 py-8">
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="text-2xl font-bold">Founders Network</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover what founders are building, view public startup progress, and share profiles.
        </p>
        <form className="mt-4 grid gap-2 sm:grid-cols-4">
          <input name="stage" defaultValue={stageFilter} placeholder="Stage (IDEA/MVP/EARLY/GROWTH)" className="rounded-md border border-border bg-background px-3 py-2 text-xs" />
          <input name="chain" defaultValue={chainFilter} placeholder="Chain (BASE/SOLANA/ETHEREUM/ARC)" className="rounded-md border border-border bg-background px-3 py-2 text-xs" />
          <label className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs">
            <input type="checkbox" name="hiring" value="1" defaultChecked={hiringOnly} />
            Hiring only
          </label>
          <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">Apply filters</button>
        </form>
      </section>

      {founders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          No public founder profiles yet.
        </div>
      ) : (
        <section className="space-y-4">
          {founders.map((founder) => {
            const companyName = founder.founderProfile?.companyName?.trim();
            const hasCompanyName = Boolean(companyName && companyName.toLowerCase() !== "check");
            const designation = founder.founderProfile?.roleTitle?.trim() || "Founder";
            const lookingForInvestors = (founder.founderProfile?.currentNeeds ?? []).some((item) =>
              /fund|investor|raise/i.test(item),
            );
            const twitterLink = normalizeExternalLink(founder.founderProfile?.twitter, "x");
            const linkedinLink = normalizeExternalLink(founder.founderProfile?.linkedin);
            const websiteLink = normalizeExternalLink(founder.founderProfile?.website);

            return (
              <article key={founder.id} className="rounded-xl border border-border/50 bg-card p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-3">
                    <CompanyLogo
                      src={founder.founderProfile?.companyLogoUrl}
                      alt={hasCompanyName ? companyName! : "Company"}
                      fallback={hasCompanyName ? companyName! : "Startup"}
                      className="h-12 w-12 rounded-xl border border-border/60 bg-background p-1"
                      fallbackClassName="rounded-xl border border-border/60 bg-background text-xs text-muted-foreground"
                      imgClassName="p-1"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold">{founder.name ?? "Founder"}</h2>
                        {hasCompanyName ? <ProfileAffiliationTag label={companyName!} variant="founder" /> : null}
                        {founder.founderProfile?.isHiring ? (
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
                            Hiring
                          </span>
                        ) : null}
                        {lookingForInvestors ? (
                          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">
                            Looking for investors
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{designation}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                        {twitterLink ? (
                          <a
                            href={twitterLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
                          >
                            <Twitter className="h-3.5 w-3.5" /> X
                          </a>
                        ) : null}
                        {linkedinLink ? (
                          <a
                            href={linkedinLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
                          >
                            <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                          </a>
                        ) : null}
                        {websiteLink ? (
                          <a
                            href={websiteLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Website
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {founder.startups[0] ? (
                      <CopyLinkButton
                        url={`${appUrl}/startups/${founder.startups[0].slug ?? founder.startups[0].id}`}
                        label="Copy profile link"
                      />
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {founder.startups.map((startup) => {
                    const ratings = startup.ratings;
                    const avg = ratings.length > 0 ? ratings.reduce((acc, item) => acc + item.score, 0) / ratings.length : 0;
                    const yourRating = ratings.find((item) => item.reviewerId === session.user.id)?.score ?? null;
                    const userSignals = [
                      ...(currentBuilderProfile?.skills ?? []),
                      ...(currentBuilderProfile?.stack ?? []),
                      ...(currentBuilderProfile?.chainExpertise ?? []),
                    ].map((item) => item.toLowerCase());
                    const needSignals = (founder.founderProfile?.currentNeeds ?? []).map((item) => item.toLowerCase());
                    const matchSignals = needSignals.filter((need) =>
                      userSignals.some((signal) => signal.includes(need) || need.includes(signal)),
                    );
                    return (
                      <div key={startup.id} className="rounded-lg border border-border/60 bg-background/60 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{startup.name}</p>
                          <span className="text-[11px] text-muted-foreground">
                            {startup.stage} | {startup.chainFocus}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{startup.tagline ?? "No tagline yet."}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                          <span>Users: {startup.usersCount ?? "-"}</span>
                          <span>Raised: {startup.revenue ?? "N/A"}</span>
                          <span>Rating: {ratings.length > 0 ? `${avg.toFixed(1)}/5 (${ratings.length})` : "Not rated"}</span>
                        </div>
                        {matchSignals.length > 0 ? (
                          <p className="mt-2 text-[11px] text-cyan-300">
                            Match signals: {Array.from(new Set(matchSignals)).slice(0, 3).join(", ")}
                          </p>
                        ) : null}
                        {startup.traction ? (
                          <p className="mt-2 text-[11px] text-muted-foreground line-clamp-2">Achievements: {startup.traction}</p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Link href={`/startups/${startup.slug ?? startup.id}`} className="text-xs text-cyan-300 hover:text-cyan-200">
                            View public startup
                          </Link>
                          {canRateStartups && session.user.id !== founder.id ? (
                            <StartupRatingForm startupId={startup.id} initialScore={yourRating} />
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

