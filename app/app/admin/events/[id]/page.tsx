import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { AdminEventForm } from "@/components/events/AdminEventForm";
import { AdminEventAttendees } from "@/components/events/AdminEventAttendees";

export const metadata = { title: "Edit Event — Admin | Webcoin Labs" };

export default async function AdminEventEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/app");
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: { _count: { select: { rsvps: true } } },
  });
  if (!event) notFound();

  return (
    <div className="space-y-8 py-8">
      <Link
        href="/app/admin/events"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </Link>
      <h1 className="text-2xl font-bold">Edit event</h1>
      <AdminEventForm event={event} />

      <section id="attendees">
        <h2 className="text-lg font-semibold mb-4">
          Attendees ({event._count.rsvps})
        </h2>
        <AdminEventAttendees eventId={id} />
      </section>
    </div>
  );
}
