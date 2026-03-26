import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { investorModules, osRouteMeta } from "@/lib/os/modules";
import { OsWorkspaceShell } from "@/components/os/OsWorkspaceShell";
import { createDiligenceMemoAction } from "@/app/actions/canonical-graph";
import { EcosystemFeedPanel } from "@/components/ecosystem/EcosystemFeedPanel";

export const metadata = { title: "Investor Workspace - Webcoin Labs" };

export default async function InvestorOsAppPage({
  params,
  searchParams,
}: {
  params: Promise<{ app: string }>;
  searchParams?: Promise<{ search?: string; scope?: string }>;
}) {
  const { app } = await params;
  const resolvedSearch = (await searchParams) ?? {};
  const moduleMeta = investorModules.find((module) => module.slug === app);
  if (!moduleMeta) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!["INVESTOR", "ADMIN"].includes(session.user.role)) redirect("/app");

  const integrations = await db.integrationConnection.findMany({ where: { userId: session.user.id, status: "CONNECTED" } });

  const wrap = (content: React.ReactNode) => (
    <OsWorkspaceShell
      title={osRouteMeta.INVESTOR.title}
      subtitle={osRouteMeta.INVESTOR.subtitle}
      rootHref={osRouteMeta.INVESTOR.root}
      modules={osRouteMeta.INVESTOR.modules}
      activeSlug={app}
      integrationConnectedCount={integrations.length}
      integrationTotalCount={4}
    >
      {content}
    </OsWorkspaceShell>
  );

  if (app === "deal-flow") {
    const applications = await db.investorApplication.findMany({
      where: session.user.role === "ADMIN" ? undefined : { investorUserId: session.user.id },
      include: { venture: { select: { id: true, name: true } }, founder: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return wrap(
      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">Deal flow inbox</p>
        {applications.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No deal-flow items yet.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {applications.map((item) => (
              <p key={item.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                {item.venture.name} · {item.status} · {item.founder.name ?? "Founder"}
              </p>
            ))}
          </div>
        )}
      </section>,
    );
  }

  if (app === "ecosystem-feed") {
    return wrap(
      <EcosystemFeedPanel
        basePath="/app/investor-os/ecosystem-feed"
        defaultScope="INVESTOR"
        search={resolvedSearch.search}
        scope={resolvedSearch.scope}
        viewerRole={session.user.role}
      />,
    );
  }

  if (app === "ventures") {
    const ventures = await db.venture.findMany({
      where: { isPublic: true },
      select: { id: true, name: true, stage: true, chainEcosystem: true },
      orderBy: { updatedAt: "desc" },
      take: 30,
    });
    return wrap(
      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">Venture discovery</p>
        {ventures.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No public ventures available.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {ventures.map((venture) => (
              <Link key={venture.id} href={`/app/investor-os/ventures/${venture.id}`} className="block rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
                {venture.name} · {venture.stage ?? "Stage"} · {venture.chainEcosystem ?? "Chain"}
              </Link>
            ))}
          </div>
        )}
      </section>,
    );
  }

  if (app === "diligence" || app === "memos") {
    const ventures = await db.venture.findMany({
      where: { isPublic: true },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
    const memos = await db.diligenceMemo.findMany({
      where: { authorUserId: session.user.id },
      include: { venture: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
    const createDiligenceMemoFormAction = async (formData: FormData) => {
      "use server";
      await createDiligenceMemoAction(formData);
    };

    return wrap(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Create diligence memo</p>
          <form action={createDiligenceMemoFormAction} className="mt-2 space-y-2">
            <select name="ventureId" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              {ventures.map((venture) => <option key={venture.id} value={venture.id}>{venture.name}</option>)}
            </select>
            <input name="title" placeholder="Memo title" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required />
            <textarea name="summary" rows={2} placeholder="Summary" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">Save memo</button>
          </form>
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Memo history</p>
          {memos.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No memos yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {memos.map((memo) => (
                <p key={memo.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                  {memo.title} · {memo.venture.name} · {memo.status}
                </p>
              ))}
            </div>
          )}
        </article>
      </section>,
    );
  }

  if (app === "meetings") {
    const meetings = await db.workspaceMeeting.findMany({
      where: { hostUserId: session.user.id },
      orderBy: { scheduledAt: "asc" },
      take: 20,
    });
    return wrap(
      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">Meetings workspace</p>
        {meetings.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No meetings scheduled yet.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {meetings.map((meeting) => (
              <p key={meeting.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                {meeting.title} · {new Date(meeting.scheduledAt).toLocaleString()}
              </p>
            ))}
          </div>
        )}
      </section>,
    );
  }

  if (app === "integrations") {
    const wallets = await db.walletConnection.count({ where: { userId: session.user.id } });
    return wrap(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Integration Center</p>
          <p className="mt-1 text-sm text-muted-foreground">{integrations.length} integration(s) connected</p>
          <p className="mt-1 text-sm text-muted-foreground">{wallets} wallet(s) connected</p>
          <Link href="/app/settings" className="mt-3 inline-flex text-xs text-cyan-300">
            Open global settings
          </Link>
        </article>
      </section>,
    );
  }

  return wrap(
    <section className="rounded-xl border border-border/60 bg-card p-4">
      <p className="text-sm font-semibold">{moduleMeta.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{moduleMeta.description}</p>
      <p className="mt-2 text-xs text-muted-foreground">Workspace route is active and ready for connected data flows.</p>
    </section>,
  );
}

