import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HiringInterestsTable } from "@/components/hiring/HiringInterestsTable";

export const metadata = { title: "Hiring Interests • Admin | Webcoin Labs" };

export default async function AdminHiringInterestsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/app");

  const entries = await prisma.hiringInterest.findMany({
    include: {
      founder: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <div className="space-y-6 py-8">
      <Link href="/app/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Hiring Interest Submissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review builder submissions and update their pipeline status.</p>
      </div>
      <HiringInterestsTable entries={entries} emptyText="No hiring submissions yet." />
    </div>
  );
}
