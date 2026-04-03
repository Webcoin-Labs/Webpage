import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/server/db/client";
import { ArrowLeft } from "lucide-react";
import { AdminPartnersForm } from "@/components/app/AdminPartnersForm";

export const metadata = { title: "Partners — Admin | Webcoin Labs" };

const CATEGORIES = ["VC", "CEX", "LAUNCHPAD", "GUILD", "MEDIA", "PORTFOLIO"] as const;

export default async function AdminPartnersPage() {
  const session = await getServerSession();
  if (session?.user.role !== "ADMIN") redirect("/app");

  const partners = await db.partner.findMany({ orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { name: "asc" }] });

  return (
    <div className="space-y-8 py-8">
      <Link href="/app/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>
      <h1 className="text-2xl font-bold">Partners</h1>
      <p className="text-muted-foreground text-sm">Create or update partners. Logo paths: /network/current/ or /network/legacy/.</p>

      <div className="p-6 rounded-xl border border-border/50 bg-card max-w-2xl">
        <h2 className="font-semibold mb-4">Add partner</h2>
        <AdminPartnersForm categories={CATEGORIES} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">All partners</h2>
        <div className="space-y-2">
          {partners.map((p) => (
            <div key={p.id} className="p-4 rounded-xl border border-border/50 bg-card flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                {p.logoPath ? (
                  <img src={p.logoPath} alt="" className="w-8 h-8 rounded object-contain bg-muted" />
                ) : (
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{p.name.charAt(0)}</div>
                )}
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category} · {p.status}</p>
                </div>
              </div>
              <AdminPartnersForm categories={CATEGORIES} existing={p} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

