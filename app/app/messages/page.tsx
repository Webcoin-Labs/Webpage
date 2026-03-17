import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, ArrowRight, Briefcase, UserRound } from "lucide-react";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Messages — Webcoin Labs" };

function introStatusClass(status: string) {
  if (status === "MATCHED") return "text-emerald-300";
  if (status === "REVIEWING") return "text-cyan-300";
  if (status === "CLOSED") return "text-muted-foreground";
  return "text-amber-300";
}

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [sentIntros, receivedIntros, applications] = await Promise.all([
    prisma.introRequest.findMany({
      where: { founderId: session.user.id },
      include: {
        targetUser: { select: { id: true, name: true, email: true } },
        targetPartner: { select: { id: true, name: true } },
        sourceProject: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.introRequest.findMany({
      where: { targetUserId: session.user.id },
      include: {
        founder: { select: { id: true, name: true, email: true } },
        sourceProject: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.jobApplication.findMany({
      where: { userId: session.user.id },
      include: {
        job: { select: { id: true, title: true, company: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">Messages & Updates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track intro requests and job application responses in one place.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs text-muted-foreground">Sent intros</p>
          <p className="mt-1 text-2xl font-semibold">{sentIntros.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs text-muted-foreground">Received intros</p>
          <p className="mt-1 text-2xl font-semibold">{receivedIntros.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs text-muted-foreground">Job applications</p>
          <p className="mt-1 text-2xl font-semibold">{applications.length}</p>
        </div>
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
          <h2 className="mb-4 text-base font-semibold">Received requests & job updates</h2>
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
