import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, Building2, CalendarDays, Inbox } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { scoringService } from "@/server/services/scoring.service";

export const metadata = { title: "Kreatorboard - Webcoin Labs" };

export default async function KreatorboardDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!["INVESTOR", "ADMIN"].includes(session.user.role)) redirect("/app");

  const [applicationCount, reviewCount, meetingsCount, ventures, company, thesisScore] = await Promise.all([
    db.investorApplication.count({ where: { investorUserId: session.user.id } }),
    db.investorApplication.count({ where: { investorUserId: session.user.id, status: { in: ["NEW", "REVIEWING"] } } }),
    db.workspaceMeeting.count({
      where: {
        OR: [{ hostUserId: session.user.id }, { guestUserId: session.user.id }],
      },
    }),
    db.venture.findMany({
      where: { isPublic: true },
      select: { id: true, name: true, stage: true, chainEcosystem: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    db.investorCompanyMember.findFirst({
      where: { userId: session.user.id, isPrimary: true },
      include: { company: true },
    }),
    venturesFitScore(session.user.id),
  ]);

  return (
    <div className="space-y-6 py-8">
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
          <Building2 className="h-3.5 w-3.5" />
          Investor Operations
        </div>
        <h1 className="text-2xl font-semibold">Kreatorboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Unified investor workspace for deal intake, thesis-fit review, and active follow-up.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Applications</p>
          <p className="mt-1 text-2xl font-semibold">{applicationCount}</p>
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Needs review</p>
          <p className="mt-1 text-2xl font-semibold">{reviewCount}</p>
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Meetings</p>
          <p className="mt-1 text-2xl font-semibold">{meetingsCount}</p>
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Thesis-fit readiness</p>
          <p className="mt-1 text-2xl font-semibold">{thesisScore}%</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Inbox className="h-4 w-4 text-cyan-300" />
            Pipeline Actions
          </div>
          <div className="space-y-2 text-sm">
            <Link href="/app/investor-os" className="block text-cyan-300 hover:text-cyan-200">
              Open investor deal-flow inbox
            </Link>
            <Link href="/app/founders" className="block text-cyan-300 hover:text-cyan-200">
              Browse founders
            </Link>
            <Link href="/startups" className="block text-cyan-300 hover:text-cyan-200">
              Browse startups
            </Link>
          </div>
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="h-4 w-4 text-cyan-300" />
            Company Context
          </div>
          <p className="text-sm text-muted-foreground">
            {company?.company?.name
              ? `${company.company.name}${company.company.description ? ` - ${company.company.description}` : ""}`
              : "No primary company/fund linked yet. Set this in profile onboarding."}
          </p>
        </article>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="h-4 w-4 text-cyan-300" />
          Venture Signals
        </div>
        {ventures.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public ventures available yet.</p>
        ) : (
          <div className="space-y-2">
            {ventures.map((venture) => (
              <div key={venture.id} className="rounded-md border border-border/60 p-2 text-xs text-muted-foreground">
                {venture.name} | {venture.stage ?? "Stage not set"} | {venture.chainEcosystem ?? "Chain not set"}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

async function venturesFitScore(investorUserId: string) {
  const investor = await db.investorProfile.findUnique({
    where: { userId: investorUserId },
    select: { stageFocus: true, chainFocus: true },
  });
  if (!investor) return 0;

  const venture = await db.venture.findFirst({
    where: { isPublic: true },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (!venture) return 0;

  const explanation = await scoringService.computeInvestorFitScore({
    investorUserId,
    ventureId: venture.id,
  });
  return explanation.score;
}

