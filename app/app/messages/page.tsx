import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, ArrowRight, Briefcase, UserRound, UserPlus, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { getServerSession, authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { cancelConnectionRequest, respondConnectionRequest, sendConnectionRequest } from "@/app/actions/connections";

export const metadata = { title: "Messages - Webcoin Labs" };

function introStatusClass(status: string) {
  if (status === "MATCHED") return "text-emerald-300";
  if (status === "REVIEWING") return "text-cyan-300";
  if (status === "CLOSED") return "text-muted-foreground";
  return "text-amber-300";
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ username?: string; source?: string; targetRole?: string; viewerRole?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const connectionRequestModel = (db as unknown as { connectionRequest?: { findMany: (...args: unknown[]) => Promise<unknown[]> } }).connectionRequest;

  const params = (await searchParams) ?? {};
  const targetUsername = params.username?.replace(/^@+/, "").toLowerCase();

  const [
    sentIntros,
    receivedIntros,
    applications,
    incomingRequests,
    outgoingRequests,
    acceptedLinks,
    targetUser,
  ] = await Promise.all([
    db.introRequest.findMany({
      where: { founderId: session.user.id },
      include: {
        targetUser: { select: { id: true, name: true, email: true } },
        targetPartner: { select: { id: true, name: true } },
        sourceProject: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.introRequest.findMany({
      where: { targetUserId: session.user.id },
      include: {
        founder: { select: { id: true, name: true, email: true } },
        sourceProject: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.jobApplication.findMany({
      where: { userId: session.user.id },
      include: {
        job: { select: { id: true, title: true, company: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    connectionRequestModel
      ? (connectionRequestModel.findMany({
          where: { toUserId: session.user.id, status: "PENDING" },
          include: { fromUser: { select: { id: true, name: true, username: true, role: true } } },
          orderBy: { createdAt: "desc" },
          take: 30,
        }) as Promise<Array<{ id: string; message: string | null; source: string | null; createdAt: Date; fromUser: { id: string; name: string | null; username: string | null; role: string } }>>)
      : Promise.resolve([]),
    connectionRequestModel
      ? (connectionRequestModel.findMany({
          where: { fromUserId: session.user.id, status: "PENDING" },
          include: { toUser: { select: { id: true, name: true, username: true, role: true } } },
          orderBy: { createdAt: "desc" },
          take: 30,
        }) as Promise<Array<{ id: string; source: string | null; toUser: { id: string; name: string | null; username: string | null; role: string } }>>)
      : Promise.resolve([]),
    db.profileLink.findMany({
      where: { fromUserId: session.user.id, label: "connection" },
      include: { toUser: { select: { id: true, name: true, username: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    targetUsername
      ? db.user.findFirst({
          where: { username: targetUsername },
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            publicProfileSettings: { select: { openToConnections: true } },
          },
        })
      : Promise.resolve(null),
  ]);

  const pendingInbound = incomingRequests.length;
  const pendingOutbound = outgoingRequests.length;

  const alreadyConnected = targetUser
    ? acceptedLinks.some((link) => link.toUser.id === targetUser.id)
    : false;

  const existingTargetPending = targetUser
    ? outgoingRequests.some((request) => request.toUser.id === targetUser.id)
    : false;

  const targetCanReceive =
    targetUser && targetUser.id !== session.user.id && (targetUser.publicProfileSettings?.openToConnections ?? true);

  return (
    <div className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">Messages & Connections</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage connection requests, intros, and application updates in one place.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs text-muted-foreground">Incoming requests</p>
          <p className="mt-1 text-2xl font-semibold">{pendingInbound}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs text-muted-foreground">Outgoing requests</p>
          <p className="mt-1 text-2xl font-semibold">{pendingOutbound}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs text-muted-foreground">Connections</p>
          <p className="mt-1 text-2xl font-semibold">{acceptedLinks.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs text-muted-foreground">Job applications</p>
          <p className="mt-1 text-2xl font-semibold">{applications.length}</p>
        </div>
      </div>

      {targetUser ? (
        <section className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-cyan-300" />
            <h2 className="text-base font-semibold">Connection request</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Target: {targetUser.name ?? targetUser.username ?? "Member"} ({targetUser.role})
          </p>
          {!targetCanReceive ? (
            <p className="mt-2 text-sm text-amber-300">This user is not available for connection requests.</p>
          ) : alreadyConnected ? (
            <p className="mt-2 text-sm text-emerald-300">You are already connected with this user.</p>
          ) : existingTargetPending ? (
            <p className="mt-2 text-sm text-cyan-300">You already have a pending request for this user.</p>
          ) : (
            <form action={sendConnectionRequest} className="mt-3 space-y-2">
              <input type="hidden" name="toUserId" value={targetUser.id} />
              <input type="hidden" name="source" value={params.source ?? "profile"} />
              <textarea
                name="message"
                rows={2}
                placeholder="Short intro message (optional)"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
                Send connection request
              </button>
            </form>
          )}
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border/50 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Incoming connection requests</h2>
            <Link href="/app/notifications?tab=requests" className="text-xs text-cyan-300 hover:text-cyan-200">
              Open request center
            </Link>
          </div>
          <div className="space-y-3">
            {incomingRequests.length === 0 ? (
              <div className="rounded-lg border border-border/40 bg-background p-4 text-sm text-muted-foreground">
                No incoming requests.
              </div>
            ) : (
              incomingRequests.map((request) => (
                <div key={request.id} className="rounded-lg border border-border/40 bg-background p-4">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-cyan-300" />
                    <p className="text-sm font-medium">
                      {request.fromUser.name ?? request.fromUser.username ?? "Member"}
                    </p>
                    <span className="ml-auto text-xs text-muted-foreground">{new Date(request.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{request.fromUser.role} | {request.source ?? "profile"}</p>
                  {request.message ? <p className="mt-2 text-xs text-muted-foreground">{request.message}</p> : null}
                  <div className="mt-3 flex gap-2">
                    <form action={respondConnectionRequest}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="decision" value="accept" />
                      <button type="submit" className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                      </button>
                    </form>
                    <form action={respondConnectionRequest}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="decision" value="decline" />
                      <button type="submit" className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">
                        <XCircle className="h-3.5 w-3.5" /> Decline
                      </button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="mb-4 text-base font-semibold">Outgoing connection requests</h2>
          <div className="space-y-3">
            {outgoingRequests.length === 0 ? (
              <div className="rounded-lg border border-border/40 bg-background p-4 text-sm text-muted-foreground">
                No outgoing requests.
              </div>
            ) : (
              outgoingRequests.map((request) => (
                <div key={request.id} className="rounded-lg border border-border/40 bg-background p-4">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-amber-300" />
                    <p className="text-sm font-medium">{request.toUser.name ?? request.toUser.username ?? "Member"}</p>
                    <span className="ml-auto text-xs text-amber-300">Pending</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{request.toUser.role} | {request.source ?? "profile"}</p>
                  <form action={cancelConnectionRequest} className="mt-3">
                    <input type="hidden" name="requestId" value={request.id} />
                    <button type="submit" className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">
                      <XCircle className="h-3.5 w-3.5" /> Cancel request
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border/50 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Sent intro requests</h2>
            <Link href="/app/intros/new" className="text-xs text-cyan-300 hover:text-cyan-200">
              New intro
            </Link>
          </div>
          <div className="space-y-3">
            {sentIntros.length === 0 ? (
              <div className="rounded-lg border border-border/40 bg-background p-4 text-sm text-muted-foreground">
                No intro requests sent yet.
              </div>
            ) : (
              sentIntros.map((item) => (
                <div key={item.id} className="rounded-lg border border-border/40 bg-background p-4">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-cyan-300" />
                    <p className="text-sm font-medium">
                      {item.targetUser?.name ?? item.targetPartner?.name ?? "New intro target"}
                    </p>
                    <span className={`ml-auto text-xs ${introStatusClass(item.status)}`}>{item.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.sourceProject?.name ? `Project: ${item.sourceProject.name}` : "No project linked"}
                  </p>
                  {item.contextSummary ? <p className="mt-2 text-xs text-muted-foreground">{item.contextSummary}</p> : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="mb-4 text-base font-semibold">Received intros & job updates</h2>
          <div className="space-y-3">
            {receivedIntros.slice(0, 10).map((item) => (
              <div key={item.id} className="rounded-lg border border-border/40 bg-background p-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-cyan-300" />
                  <p className="text-sm font-medium">
                    Intro from {item.founder.name ?? item.founder.email ?? "Founder"}
                  </p>
                  <span className={`ml-auto text-xs ${introStatusClass(item.status)}`}>{item.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.sourceProject?.name ? `Project: ${item.sourceProject.name}` : "No project linked"}
                </p>
              </div>
            ))}

            {applications.slice(0, 10).map((app) => (
              <div key={app.id} className="rounded-lg border border-border/40 bg-background p-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-emerald-300" />
                  <p className="text-sm font-medium">{app.job.title}</p>
                  <span className="ml-auto text-xs text-muted-foreground">{app.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{app.job.company}</p>
              </div>
            ))}

            {receivedIntros.length === 0 && applications.length === 0 ? (
              <div className="rounded-lg border border-border/40 bg-background p-4 text-sm text-muted-foreground">
                No updates yet. As you apply to jobs or receive intro requests, updates will appear here.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 text-sm">
        <p className="text-muted-foreground">
          Need direct support? Reach us via{" "}
          <a href="https://t.me/webcoinlabs" target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:text-cyan-200">
            Telegram
          </a>{" "}
          or{" "}
          <a href="mailto:hello@webcoinlabs.com" className="text-cyan-300 hover:text-cyan-200">
            email
          </a>
          .
        </p>
        <Link href="/app/intros/new" className="mt-2 inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200">
          Create intro request <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
