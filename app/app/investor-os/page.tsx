import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, CalendarClock, Filter, SearchCheck, Wallet, TrendingUp, FileText } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { updateInvestorApplicationStatus } from "@/app/actions/webcoin-os";
import { createInvestorCommitment, updateInvestorCommitmentStatus } from "@/app/actions/founder-os-expansion";
import { createDiligenceMemoAction, recomputeMyScoresAction } from "@/app/actions/canonical-graph";

export const metadata = { title: "Investor OS - Webcoin Labs" };

function percentage(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export default async function InvestorOsPage({
  searchParams,
}: {
  searchParams?: Promise<{ stage?: string; chain?: string; minRound?: string; maxRound?: string; checkFit?: string; memoStatus?: string; memoVentureId?: string }>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!["INVESTOR", "ADMIN"].includes(session.user.role)) redirect("/app");
  const stageFilter = resolvedSearchParams?.stage?.trim() || "";
  const chainFilter = resolvedSearchParams?.chain?.trim() || "";
  const minRoundFilter = Number(resolvedSearchParams?.minRound ?? "");
  const maxRoundFilter = Number(resolvedSearchParams?.maxRound ?? "");
  const checkFitOnly = resolvedSearchParams?.checkFit === "1";
  const memoStatusFilter = resolvedSearchParams?.memoStatus?.trim() || "";
  const memoVentureFilter = resolvedSearchParams?.memoVentureId?.trim() || "";
  const ventureWhere =
    stageFilter || chainFilter
      ? {
          ...(stageFilter ? { stage: { equals: stageFilter, mode: "insensitive" as const } } : {}),
          ...(chainFilter ? { chainEcosystem: { equals: chainFilter, mode: "insensitive" as const } } : {}),
        }
      : undefined;

  const [investorProfile, companyMember, applications, ventures, meetings, integrations, walletCount, activeRounds, diligenceMemos, latestInvestorFitSnapshot] = await Promise.all([
    db.investorProfile.findUnique({
      where: { userId: session.user.id },
      include: { company: true },
    }),
    db.investorCompanyMember.findFirst({
      where: { userId: session.user.id, isPrimary: true },
      include: { company: true },
    }),
    db.investorApplication.findMany({
      where: session.user.role === "ADMIN" ? undefined : { investorUserId: session.user.id },
      include: {
        founder: { select: { id: true, name: true, username: true } },
        venture: { select: { id: true, name: true, stage: true, chainEcosystem: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.venture.findMany({
      where: { isPublic: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    db.workspaceMeeting.findMany({
      where: { hostUserId: session.user.id },
      orderBy: { scheduledAt: "asc" },
      take: 6,
    }),
    db.integrationConnection.findMany({ where: { userId: session.user.id, status: "CONNECTED" } }),
    db.walletConnection.count({ where: { userId: session.user.id } }),
    db.raiseRound.findMany({
      where: {
        isActive: true,
        status: { in: ["ACTIVE", "PAUSED"] },
        ...(ventureWhere ? { venture: ventureWhere } : {}),
        ...(Number.isFinite(minRoundFilter) ? { targetAmount: { gte: minRoundFilter } } : {}),
        ...(Number.isFinite(maxRoundFilter) ? { targetAmount: { lte: maxRoundFilter } } : {}),
      },
      include: {
        venture: { select: { id: true, name: true, chainEcosystem: true, stage: true } },
        founder: { select: { id: true, name: true, username: true } },
        builderAsks: true,
        commitments: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    db.diligenceMemo.findMany({
      where: { authorUserId: session.user.id },
      include: { venture: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    db.scoreSnapshot.findFirst({
      where: {
        kind: "INVESTOR_FIT_HELPER",
        scoredUserId: session.user.id,
      },
      orderBy: { computedAt: "desc" },
    }),
  ]);

  const statusCount = {
    NEW: applications.filter((item) => item.status === "NEW").length,
    REVIEWING: applications.filter((item) => item.status === "REVIEWING").length,
    INTERESTED: applications.filter((item) => item.status === "INTERESTED").length,
    MEETING_SCHEDULED: applications.filter((item) => item.status === "MEETING_SCHEDULED").length,
    PASSED: applications.filter((item) => item.status === "PASSED").length,
  };

  const thesisCoverage = percentage(
    [
      investorProfile?.investmentThesis,
      investorProfile?.investorType,
      investorProfile?.stageFocus.length ? "stage" : "",
      investorProfile?.chainFocus.length ? "chain" : "",
      investorProfile?.sectorFocus.length ? "sector" : "",
      investorProfile?.checkSizeMin !== null ? "min" : "",
      investorProfile?.checkSizeMax !== null ? "max" : "",
      companyMember?.company?.name || investorProfile?.firmName,
    ].filter(Boolean).length,
    8,
  );
  const investorMin = investorProfile?.checkSizeMin ?? null;
  const investorMax = investorProfile?.checkSizeMax ?? null;
  const filteredRounds = checkFitOnly
    ? activeRounds.filter((round) => {
        const minTicket = round.minTicketSize ? Number(round.minTicketSize) : null;
        const maxTicket = round.maxTicketSize ? Number(round.maxTicketSize) : null;
        if (investorMin === null && investorMax === null) return true;
        if (investorMin !== null && maxTicket !== null && investorMin > maxTicket) return false;
        if (investorMax !== null && minTicket !== null && investorMax < minTicket) return false;
        return true;
      })
    : activeRounds;
  const filteredMemos = diligenceMemos.filter((memo) => {
    if (memoStatusFilter && memo.status !== memoStatusFilter) return false;
    if (memoVentureFilter && memo.ventureId !== memoVentureFilter) return false;
    return true;
  });

  const updateStatusAction = async (formData: FormData) => {
    "use server";
    await updateInvestorApplicationStatus(formData);
  };
  const createCommitmentAction = async (formData: FormData) => {
    "use server";
    await createInvestorCommitment(formData);
  };
  const updateCommitmentStatusAction = async (formData: FormData) => {
    "use server";
    await updateInvestorCommitmentStatus(formData);
  };
  const recomputeInvestorScoreAction = async (formData: FormData) => {
    "use server";
    await recomputeMyScoresAction(formData);
  };
  const createDiligenceMemoFormAction = async (formData: FormData) => {
    "use server";
    await createDiligenceMemoAction(formData);
  };

  return (
    <div className="space-y-6 py-8">
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="text-2xl font-semibold">Investor OS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Deal-flow + identity + evaluation workspace with founder application routing and thesis-aligned discovery.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Incoming applications</p>
          <p className="mt-1 text-2xl font-semibold">{applications.length}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Thesis completeness</p>
          <p className="mt-1 text-2xl font-semibold">{thesisCoverage}%</p>
          <div className="mt-2 h-2 rounded-full bg-border">
            <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${thesisCoverage}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Connected tools</p>
          <p className="mt-1 text-2xl font-semibold">{integrations.length}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">{integrations.map((item) => item.provider).join(", ") || "No integrations connected."}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Wallets</p>
          <p className="mt-1 text-2xl font-semibold">{walletCount}</p>
          <Link href="/app/settings" className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-300">
            <Wallet className="h-3.5 w-3.5" /> Manage wallet
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-cyan-300" />
            <p className="text-sm font-semibold">Public Investor Identity</p>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="rounded-md border border-border/60 px-3 py-2">Name: {session.user.name ?? "Not set"}</p>
            <p className="rounded-md border border-border/60 px-3 py-2">Investor type: {investorProfile?.investorType ?? "Not set"}</p>
            <p className="rounded-md border border-border/60 px-3 py-2">
              Company/Fund: {companyMember?.company?.name ?? investorProfile?.company?.name ?? investorProfile?.firmName ?? "Independent"}
            </p>
            <p className="rounded-md border border-border/60 px-3 py-2">
              Check size: {investorProfile?.checkSizeMin ?? 0} - {investorProfile?.checkSizeMax ?? 0}
            </p>
          </div>
          <Link href="/app/profile" className="mt-3 inline-flex text-xs text-cyan-300">
            Update investor profile
          </Link>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-cyan-300" />
            <p className="text-sm font-semibold">Pipeline Breakdown</p>
          </div>
          <div className="space-y-2 text-xs">
            {Object.entries(statusCount).map(([label, count]) => (
              <div key={label} className="rounded-md border border-border/60 px-3 py-2">
                <div className="mb-1 flex items-center justify-between">
                  <span>{label.replaceAll("_", " ")}</span>
                  <span>{count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-border">
                  <div className="h-1.5 rounded-full bg-cyan-500" style={{ width: `${percentage(count, applications.length)}%` }} />
                </div>
              </div>
            ))}
          </div>
          {latestInvestorFitSnapshot ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Latest fit snapshot: {latestInvestorFitSnapshot.score} ({latestInvestorFitSnapshot.label ?? "n/a"}) on{" "}
              {new Date(latestInvestorFitSnapshot.computedAt).toLocaleString()}
            </p>
          ) : null}
          <form action={recomputeInvestorScoreAction} className="mt-2 flex gap-2">
            <input type="hidden" name="scope" value="investor" />
            <select name="ventureId" className="rounded-md border border-border bg-background px-2 py-1 text-xs">
              {ventures.map((venture) => (
                <option key={venture.id} value={venture.id}>
                  {venture.name}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs">
              Recompute fit snapshot
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-cyan-300" />
          <p className="text-sm font-semibold">Current Raising Rounds</p>
        </div>
        <form className="mb-3 grid gap-2 sm:grid-cols-5">
          <input name="stage" defaultValue={stageFilter} placeholder="Stage" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
          <input name="chain" defaultValue={chainFilter} placeholder="Chain" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
          <input name="minRound" defaultValue={resolvedSearchParams?.minRound ?? ""} placeholder="Min round size" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
          <input name="maxRound" defaultValue={resolvedSearchParams?.maxRound ?? ""} placeholder="Max round size" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
          <label className="inline-flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs">
            <input type="checkbox" name="checkFit" value="1" defaultChecked={checkFitOnly} />
            Check-size fit only
          </label>
          <button type="submit" className="w-fit rounded-md border border-border px-2 py-1 text-xs">
            Apply filters
          </button>
        </form>
        {filteredRounds.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active raising rounds currently.</p>
        ) : (
          <div className="space-y-3">
            {filteredRounds.map((round) => (
              <article key={round.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{round.venture.name} | {round.roundName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Founder: {round.founder.name ?? round.founder.username ?? "Founder"} | {round.venture.stage ?? "Stage"} | {round.venture.chainEcosystem ?? "Chain"}
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">
                    {round.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {round.currency} {Number(round.raisedAmount)} / {Number(round.targetAmount)} | Min ticket {round.minTicketSize ? Number(round.minTicketSize) : "-"} | Max ticket {round.maxTicketSize ? Number(round.maxTicketSize) : "-"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Soft committed {round.currency} {Number(round.committedAmount)} | Interested {round.currency} {Number(round.interestedAmount)} | Coverage{" "}
                  {round.coverageRatio ? `${Number(round.coverageRatio).toFixed(2)}%` : "n/a"}
                </p>
                {round.builderAsks.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {round.builderAsks.map((ask) => (
                      <p key={ask.id} className="text-[11px] text-muted-foreground">
                        Builder ask: {ask.roleTitle} | Skills: {ask.skillTags.join(", ")} | Ask: {ask.askAmount ? `${round.currency} ${Number(ask.askAmount)}` : "-"}
                      </p>
                    ))}
                  </div>
                ) : null}
                <form action={createCommitmentAction} className="mt-2 space-y-2">
                  <input type="hidden" name="roundId" value={round.id} />
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input name="amount" type="number" step="0.01" placeholder="Soft commitment amount" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                    <select name="status" defaultValue="INTERESTED" className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                      <option value="INTERESTED">Interested</option>
                      <option value="SOFT_COMMITTED">Soft Committed</option>
                      <option value="REVIEWING">Reviewing</option>
                      <option value="PASSED">Passed</option>
                    </select>
                    <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs">
                      Save commitment
                    </button>
                  </div>
                  <textarea name="note" rows={2} placeholder="Commitment note" className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs" />
                </form>
                {round.commitments.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {round.commitments.map((commitment) => (
                      <form key={commitment.id} action={updateCommitmentStatusAction} className="flex items-center gap-2">
                        <input type="hidden" name="commitmentId" value={commitment.id} />
                        <span className="text-[11px] text-muted-foreground">
                          Commitment {commitment.amount ? `${round.currency} ${Number(commitment.amount)}` : "-"}
                        </span>
                        <select name="status" defaultValue={commitment.status} className="rounded-md border border-border bg-background px-2 py-1 text-[11px]">
                          <option value="INTERESTED">Interested</option>
                          <option value="SOFT_COMMITTED">Soft Committed</option>
                          <option value="REVIEWING">Reviewing</option>
                          <option value="PASSED">Passed</option>
                        </select>
                        <button type="submit" className="rounded-md border border-border px-2 py-1 text-[11px]">
                          Update
                        </button>
                      </form>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <SearchCheck className="h-4 w-4 text-cyan-300" />
          <p className="text-sm font-semibold">Founder Applications Inbox</p>
        </div>
        {applications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No founder applications yet.</p>
        ) : (
          <div className="space-y-2">
            {applications.map((application) => (
              <article key={application.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{application.venture.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Founder: {application.founder.name ?? application.founder.username ?? "Founder"} | {application.venture.stage ?? "Stage not set"} | {application.venture.chainEcosystem ?? "Chain not set"}
                    </p>
                  </div>
                  <form action={updateStatusAction} className="flex items-center gap-2">
                    <input type="hidden" name="applicationId" value={application.id} />
                    <select
                      name="status"
                      defaultValue={application.status}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                    >
                      <option value="NEW">New</option>
                      <option value="REVIEWING">Reviewing</option>
                      <option value="INTERESTED">Interested</option>
                      <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
                      <option value="PASSED">Passed</option>
                    </select>
                    <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs">
                      Save
                    </button>
                  </form>
                </div>
                {application.note ? <p className="mt-2 text-xs text-muted-foreground">{application.note}</p> : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-cyan-300" />
            <p className="text-sm font-semibold">Upcoming Meetings</p>
          </div>
          {meetings.length === 0 ? (
            <p className="text-xs text-muted-foreground">No meetings scheduled from Investor OS yet.</p>
          ) : (
            <div className="space-y-2">
              {meetings.map((meeting) => (
                <p key={meeting.id} className="rounded-md border border-border/60 px-3 py-2 text-xs text-muted-foreground">
                  {meeting.title} | {new Date(meeting.scheduledAt).toLocaleString()}
                </p>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="mb-2 text-sm font-semibold">Venture Discovery</p>
          {ventures.length === 0 ? (
            <p className="text-xs text-muted-foreground">No public ventures available yet.</p>
          ) : (
            <div className="space-y-2">
              {ventures.map((venture) => (
                <p key={venture.id} className="rounded-md border border-border/60 px-3 py-2 text-xs text-muted-foreground">
                  {venture.name} | {venture.stage ?? "Stage"} | {venture.chainEcosystem ?? "Chain"}
                </p>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-cyan-300" />
          <p className="text-sm font-semibold">Diligence Workspace</p>
        </div>
        <div className="mb-3 rounded-md border border-border/60 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Memo drafting guide</p>
          <p className="mt-1">Capture evidence first, then risks, then next actions. Avoid speculative predictions.</p>
          <p className="mt-1">Suggested memo titles: `Team Review - [Venture]`, `Token Risk Snapshot - [Venture]`, `Security Diligence - [Venture]`.</p>
        </div>
        <form action={createDiligenceMemoFormAction} className="space-y-2">
          <select name="ventureId" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
            {ventures.map((venture) => (
              <option key={venture.id} value={venture.id}>
                {venture.name}
              </option>
            ))}
          </select>
          <input name="title" placeholder="Memo title" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required />
          <textarea name="summary" rows={2} placeholder="Summary" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
          <div className="grid gap-2 sm:grid-cols-2">
            <textarea name="product" rows={2} placeholder="Product notes" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <textarea name="market" rows={2} placeholder="Market notes" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <textarea name="team" rows={2} placeholder="Team notes" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <textarea name="traction" rows={2} placeholder="Traction notes" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input name="riskLegal" placeholder="Legal risk" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <input name="riskSecurity" placeholder="Security risk" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <input name="riskGovernance" placeholder="Governance risk" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Risk severity convention: `low`, `moderate`, `high`, `critical` plus one evidence source line in each section.
          </p>
          <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
            Save diligence memo
          </button>
        </form>
        <form className="mt-3 grid gap-2 sm:grid-cols-3">
          <select name="memoStatus" defaultValue={memoStatusFilter} className="rounded-md border border-border bg-background px-2 py-1 text-xs">
            <option value="">All statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="IN_REVIEW">IN_REVIEW</option>
            <option value="FINAL">FINAL</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
          <select name="memoVentureId" defaultValue={memoVentureFilter} className="rounded-md border border-border bg-background px-2 py-1 text-xs">
            <option value="">All ventures</option>
            {ventures.map((venture) => (
              <option key={venture.id} value={venture.id}>
                {venture.name}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs">Filter memos</button>
        </form>
        <div className="mt-3 space-y-2">
          {filteredMemos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No diligence memos created yet.</p>
          ) : (
            filteredMemos.map((memo) => (
              <div key={memo.id} className="rounded-md border border-border/60 p-3">
                <p className="text-sm font-medium">{memo.title}</p>
                <p className="text-xs text-muted-foreground">
                  {memo.venture.name} | {memo.status} | {new Date(memo.updatedAt).toLocaleString()}
                </p>
                {memo.summary ? <p className="mt-1 text-xs text-muted-foreground">{memo.summary}</p> : null}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
