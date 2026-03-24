import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { createBroadcastNotification } from "@/app/actions/notifications";
import { createInviteOnlyCode } from "@/app/actions/invite-community";

export const metadata = { title: "Admin Notifications - Webcoin Labs" };

export default async function AdminNotificationsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/app");

  const [notifications, inviteCodes] = await Promise.all([
    db.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        _count: { select: { reads: true } },
      },
    }),
    db.inviteOnlyCode.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
  ]);

  const createNotificationAction = async (formData: FormData) => {
    "use server";
    await createBroadcastNotification(formData);
  };
  const createCodeAction = async (formData: FormData) => {
    "use server";
    await createInviteOnlyCode(formData);
  };

  return (
    <div className="space-y-6 py-8">
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="text-2xl font-bold">Admin Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">Broadcast feature updates by role and manage invite-only community access codes.</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <h2 className="text-sm font-semibold">Broadcast Notification</h2>
          <form action={createNotificationAction} className="mt-3 space-y-3">
            <input name="title" placeholder="Title" required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <textarea name="message" rows={4} placeholder="Message" required className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input name="featureUrl" placeholder="Optional feature URL, e.g. /app/builder-projects" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2 text-xs">
              {["BUILDER", "FOUNDER", "INVESTOR", "ADMIN"].map((role) => (
                <label key={role} className="inline-flex items-center gap-2 rounded border border-border px-2 py-1.5">
                  <input type="checkbox" name="targetRoles" value={role} defaultChecked={role !== "ADMIN"} className="accent-cyan-500" />
                  {role}
                </label>
              ))}
            </div>
            <button type="submit" className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-200">
              Send notification
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5">
          <h2 className="text-sm font-semibold">Create Invite-Only Code</h2>
          <form action={createCodeAction} className="mt-3 space-y-3">
            <input name="label" placeholder="Label (optional)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input name="maxUses" type="number" min={1} placeholder="Max uses" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input name="expiresAt" type="datetime-local" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <button type="submit" className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-200">
              Generate code
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <h2 className="text-sm font-semibold">Recent Notifications</h2>
          <div className="mt-3 space-y-2">
            {notifications.length === 0 ? (
              <p className="text-xs text-muted-foreground">No notifications yet.</p>
            ) : (
              notifications.map((item) => (
                <div key={item.id} className="rounded-lg border border-border/50 p-3">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.message}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Roles: {item.targetRoles.join(", ")} | Reads: {item._count.reads}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5">
          <h2 className="text-sm font-semibold">Invite Codes</h2>
          <div className="mt-3 space-y-2">
            {inviteCodes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No invite codes generated yet.</p>
            ) : (
              inviteCodes.map((item) => (
                <div key={item.id} className="rounded-lg border border-border/50 p-3">
                  <p className="text-sm font-medium">{item.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.label ?? "No label"} | Active: {item.isActive ? "Yes" : "No"} | Used: {item.usedCount}
                    {item.maxUses ? `/${item.maxUses}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
