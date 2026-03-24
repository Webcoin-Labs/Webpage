import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession, authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { ArrowLeft, Plus } from "lucide-react";
import { AdminEventsTable } from "@/components/events/AdminEventsTable";

export const metadata = { title: "Events — Admin | Webcoin Labs" };

export default async function AdminEventsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/app");

  const events = await db.event.findMany({
    include: { _count: { select: { rsvps: true } } },
    orderBy: { startAt: "desc" },
  });

  return (
    <div className="space-y-6 py-8">
      <Link
        href="/app/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link
          href="/app/admin/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 text-sm font-medium border border-cyan-500/30"
        >
          <Plus className="w-4 h-4" /> Create event
        </Link>
      </div>
      <AdminEventsTable events={events} />
    </div>
  );
}
