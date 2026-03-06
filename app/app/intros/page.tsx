import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { IntroRequestsList } from "./IntroRequestsList";

export const metadata = { title: "Intro Requests — Webcoin Labs" };

export default async function IntrosPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user;

  const requests = await prisma.introRequest.findMany({
    where: { founderId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const canCreate = user.role === "FOUNDER" || user.role === "ADMIN";

  return (
    <div className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Intro Requests</h1>
          <p className="text-muted-foreground mt-1">
            Request KOL or VC intros. We review and match internally — no raw contact lists are shared.
          </p>
        </div>
        {canCreate && (
          <Link
            href="/app/intros/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-sm font-semibold hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> New Request
          </Link>
        )}
      </div>

      <IntroRequestsList requests={requests} />
    </div>
  );
}
