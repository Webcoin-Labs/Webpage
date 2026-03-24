import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { HiringInterestsTable } from "@/components/hiring/HiringInterestsTable";
import { HiringInterestForm } from "@/components/hiring/HiringInterestForm";
import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";
import { CompanyLogo } from "@/components/common/CompanyLogo";

export const metadata = { title: "Hiring - Webcoin Labs" };

export default async function HiringPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user;
  const isFounder = user.role === "FOUNDER";
  const isBuilder = user.role === "BUILDER";

  const [receivedInterests, hiringFounders] = await Promise.all([
    isFounder
      ? db.hiringInterest.findMany({
          where: { founderId: user.id },
          orderBy: { createdAt: "desc" },
          take: 120,
        })
      : Promise.resolve([]),
    isBuilder
      ? db.founderProfile.findMany({
          where: { isHiring: true },
          include: {
            user: { select: { id: true, name: true } },
            _count: { select: { hiringInterests: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 30,
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Hiring</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Founder-builder hiring interest flow powered by real profile and company data.
        </p>
      </div>

      {isFounder ? (
        <section className="rounded-2xl border border-border/50 bg-card p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Builder Interest Inbox</h2>
              <p className="text-xs text-muted-foreground">
                Incoming submissions from builders interested in your startup.
              </p>
            </div>
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
              {receivedInterests.length} submissions
            </span>
          </div>
          <HiringInterestsTable entries={receivedInterests} emptyText="No hiring submissions yet." />
        </section>
      ) : null}

      {isBuilder ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Founders Hiring Now</h2>
            <p className="text-xs text-muted-foreground">
              Send a lightweight interest form with your skills and portfolio.
            </p>
          </div>
          {hiringFounders.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              No active founder hiring posts right now.
            </p>
          ) : (
            <div className="space-y-3">
              {hiringFounders.map((founder) => (
                <div key={founder.id} className="rounded-xl border border-border/50 bg-card p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CompanyLogo
                        src={founder.companyLogoUrl}
                        alt={founder.companyName ?? "Company"}
                        fallback={founder.companyName ?? "Company"}
                        className="h-11 w-11 rounded-xl border border-border/60 bg-background p-1"
                        fallbackClassName="rounded-xl border border-border/60 bg-background text-sm text-muted-foreground"
                        imgClassName="p-1"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{founder.user.name ?? "Founder"}</p>
                          <ProfileAffiliationTag label={founder.companyName} variant="founder" />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {founder.roleTitle ?? "Founder"}
                          {founder.chainFocus ? ` | ${founder.chainFocus}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200">
                      Hiring | {founder._count.hiringInterests} interests
                    </span>
                  </div>
                  <HiringInterestForm
                    founderId={founder.userId}
                    founderLabel={founder.companyName ?? founder.user.name ?? "Founder"}
                    initialName={user.name ?? ""}
                    initialEmail={user.email ?? ""}
                    compact
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {!isFounder && !isBuilder ? (
        <p className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          Hiring flow is available for founders and builders.
        </p>
      ) : null}
    </div>
  );
}
