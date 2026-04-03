import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";
import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

export const metadata = { title: "My Applications — Webcoin Labs" };

const statusColors: Record<string, string> = {
  NEW: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  REVIEWING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ACCEPTED: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
};

export default async function ApplicationsPage() {
  const session = await getServerSession();
  const applications = await db.application.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Applications</h1>
          <p className="text-muted-foreground mt-1">View status of your submitted applications.</p>
        </div>
        <Link
          href="/app/apply"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm font-medium border border-cyan-500/20 hover:bg-cyan-500/20"
        >
          <FileText className="w-4 h-4" /> New application <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border/50 rounded-xl">
          <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
          <p className="font-medium mb-1">No applications yet</p>
          <p className="text-sm text-muted-foreground mb-4">Apply to Builder Program or Founder Support to get started.</p>
          <Link href="/app/apply" className="text-sm text-cyan-400 hover:text-cyan-300">Apply now →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const answers = app.answers as Record<string, string>;
            return (
              <div key={app.id} className="p-5 rounded-xl border border-border/50 bg-card">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-medium text-sm">{app.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(app.createdAt).toLocaleDateString()}</p>
                    {answers?.why && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{answers.why}</p>}
                    {typeof answers?.aiFitScore === "number" ? (
                      <p className="mt-2 text-xs text-cyan-300">AI fit score: {answers.aiFitScore}/100</p>
                    ) : null}
                    {typeof answers?.coverLetter === "string" && answers.coverLetter.trim() ? (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">Cover letter: {answers.coverLetter}</p>
                    ) : null}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[app.status] ?? "bg-muted"}`}>
                    {app.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

