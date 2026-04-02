import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/server/db/client";
import { ArrowLeft } from "lucide-react";
import { AdminIntroRequestsTable } from "@/components/app/AdminIntroRequestsTable";

export const metadata = { title: "Intro Requests — Admin | Webcoin Labs" };

export default async function AdminIntrosPage() {
  const session = await getServerSession();
  if (session?.user.role !== "ADMIN") redirect("/app");

  const requests = await db.introRequest.findMany({
    include: {
      founder: { select: { id: true, name: true, email: true } },
      sourceProject: { select: { name: true } },
      targetUser: {
        select: {
          name: true,
          email: true,
          builderProfile: {
            select: { affiliation: true, independent: true, openToWork: true },
          },
        },
      },
      targetPartner: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 py-8">
      <Link href="/app/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>
      <h1 className="text-2xl font-bold">Intro Requests</h1>
      <p className="text-muted-foreground text-sm">Review and update status. No contact lists are exposed.</p>
      <AdminIntroRequestsTable requests={requests} />
    </div>
  );
}

