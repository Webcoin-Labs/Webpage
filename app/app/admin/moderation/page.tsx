import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { ModerationBuilders } from "@/components/app/ModerationBuilders";
import { ModerationProjects } from "@/components/app/ModerationProjects";

export const metadata = { title: "Moderation — Admin | Webcoin Labs" };

export default async function AdminModerationPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/app");

  const [builders, projects] = await Promise.all([
    prisma.builderProfile.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      include: { owner: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8 py-8">
      <Link href="/app/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>
      <h1 className="text-2xl font-bold">Moderation</h1>
      <p className="text-muted-foreground text-sm">Toggle visibility (public directory) and &quot;Verified by Webcoin Labs&quot; for builders and projects.</p>

      <ModerationBuilders builders={builders} />
      <ModerationProjects projects={projects} />
    </div>
  );
}
