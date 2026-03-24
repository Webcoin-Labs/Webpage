import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { IntroRequestsList } from "./IntroRequestsList";

export const metadata = { title: "Intro Requests - Webcoin Labs" };

export default async function IntrosPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user;

  const requests = await db.introRequest.findMany({
    where: { founderId: user.id },
    include: {
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

  const canCreate = user.role === "FOUNDER" || user.role === "ADMIN";

  return (
    <div className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Intro Requests</h1>
          <p className="mt-1 text-muted-foreground">
            Request KOL or VC intros. We review and match internally, and no raw contact lists are shared.
          </p>
        </div>
        {canCreate && (
          <Link
            href="/app/intros/new"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New Request
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {["PENDING", "REVIEWING", "MATCHED", "CLOSED"].map((status) => (
          <div key={status} className="rounded-lg border border-border/50 bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{status}</p>
            <p className="mt-1 text-xl font-semibold">{requests.filter((r) => r.status === status).length}</p>
          </div>
        ))}
      </div>

      <IntroRequestsList requests={requests} />
    </div>
  );
}
