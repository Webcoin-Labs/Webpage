import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminEventForm } from "@/components/events/AdminEventForm";

export const metadata = { title: "New Event — Admin | Webcoin Labs" };

export default async function NewEventPage() {
  const session = await getServerSession();
  if (session?.user.role !== "ADMIN") redirect("/app");

  return (
    <div className="space-y-6 py-8">
      <Link
        href="/app/admin/events"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </Link>
      <h1 className="text-2xl font-bold">Create event</h1>
      <AdminEventForm />
    </div>
  );
}

