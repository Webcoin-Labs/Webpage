import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Leads — Admin | Webcoin Labs" };

export default async function AdminLeadsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/app");

  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div className="space-y-6 py-8">
      <Link href="/app/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>
      <h1 className="text-2xl font-bold">Leads</h1>
      <p className="text-muted-foreground text-sm">Contact, strategy call, and jobs waitlist submissions.</p>

      {leads.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8">No leads yet.</p>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="p-5 rounded-xl border border-border/50 bg-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{lead.name}</p>
                  <p className="text-sm text-muted-foreground">{lead.email}</p>
                  {lead.company && <p className="text-xs text-muted-foreground">{lead.company}</p>}
                  {lead.source && (
                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {lead.source}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm mt-3 border-t border-border/50 pt-3 whitespace-pre-wrap">{lead.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
