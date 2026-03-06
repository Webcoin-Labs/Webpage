import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { AdminIntroRequestsTable } from "@/components/app/AdminIntroRequestsTable";

export const metadata = { title: "Intro Requests — Admin | Webcoin Labs" };

export default async function AdminIntrosPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/app");

  const requests = await prisma.introRequest.findMany({
    include: { founder: { select: { id: true, name: true, email: true } } },
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
