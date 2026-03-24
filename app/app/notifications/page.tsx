import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BellRing, CheckCircle2 } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";

export const metadata = { title: "Notifications - Webcoin Labs" };

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const notifications = await db.notification.findMany({
    where: {
      targetRoles: {
        has: session.user.role,
      },
    },
    include: {
      reads: {
        where: { userId: session.user.id },
        select: { id: true, readAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  const unreadCount = notifications.filter((item) => item.reads.length === 0).length;

  const readAllAction = async () => {
    "use server";
    await markAllNotificationsRead();
  };
  const markOneAction = async (formData: FormData) => {
    "use server";
    await markNotificationRead(String(formData.get("notificationId") ?? ""));
  };

  return (
    <div className="space-y-6 py-8">
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">Feature launches, updates, and admin announcements for your role.</p>
          </div>
          <form action={readAllAction}>
            <button type="submit" className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200">
              Mark all read ({unreadCount})
            </button>
          </form>
        </div>
      </section>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          No notifications yet.
        </div>
      ) : (
        <section className="space-y-3">
          {notifications.map((item) => {
            const isUnread = item.reads.length === 0;
            return (
              <article key={item.id} className={`rounded-xl border p-4 ${isUnread ? "border-cyan-500/30 bg-cyan-500/5" : "border-border/60 bg-card"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <BellRing className={`h-4 w-4 ${isUnread ? "text-cyan-300" : "text-muted-foreground"}`} />
                      <h2 className="text-sm font-semibold">{item.title}</h2>
                      {isUnread ? (
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">New</span>
                      ) : (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">Read</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{item.message}</p>
                    {item.featureUrl ? (
                      <Link href={item.featureUrl} className="mt-2 inline-flex text-xs text-cyan-300 hover:text-cyan-200">
                        Open related feature
                      </Link>
                    ) : null}
                  </div>
                  {isUnread ? (
                    <form action={markOneAction}>
                      <input type="hidden" name="notificationId" value={item.id} />
                      <button type="submit" className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark read
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
