import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { updateJobApplicationStatus, updateJobPostStatus } from "@/app/actions/jobs";

export const metadata = { title: "Jobs — Admin | Webcoin Labs" };

export default async function AdminJobsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/app");

  const [jobs, applications] = await Promise.all([
    db.jobPost.findMany({
      include: {
        createdBy: { select: { name: true, email: true } },
        project: { select: { name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.jobApplication.findMany({
      include: {
        user: { select: { name: true, email: true } },
        job: { select: { title: true, company: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
  ]);

  return (
    <div className="space-y-8 py-8">
      <Link href="/app/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Jobs Admin</h1>
        <p className="text-muted-foreground text-sm mt-1">Inspect and manage job posts and applications.</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-4">Job posts</h2>
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-xl border border-border/50 bg-card p-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{job.title} · {job.company}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {job.roleType.replaceAll("_", " ")} · {job.locationType} · {job.chainFocus ?? "General"} · {job._count.applications} applications
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    By {job.createdBy.name ?? job.createdBy.email ?? "Unknown"} {job.project ? `· Project: ${job.project.name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(["OPEN", "DRAFT", "CLOSED"] as const).map((status) => (
                    <form key={status} action={updateJobPostStatus.bind(null, job.id, status)}>
                      <button
                        type="submit"
                        className={`text-xs px-2 py-1 rounded-full border ${job.status === status ? "border-cyan-500/40 text-cyan-300" : "border-border text-muted-foreground"}`}
                      >
                        {status}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Job applications</h2>
        <div className="space-y-3">
          {applications.map((application) => (
            <div key={application.id} className="rounded-xl border border-border/50 bg-card p-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{application.job.title} · {application.job.company}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Candidate: {application.user.name ?? application.user.email ?? "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{application.message}</p>
                  {application.resumeUrl ? (
                    <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-300 mt-1 inline-block">
                      Resume / portfolio
                    </a>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(["APPLIED", "REVIEWING", "SHORTLISTED", "REJECTED", "HIRED"] as const).map((status) => (
                    <form key={status} action={updateJobApplicationStatus.bind(null, application.id, status)}>
                      <button
                        type="submit"
                        className={`text-[11px] px-2 py-1 rounded-full border ${application.status === status ? "border-cyan-500/40 text-cyan-300" : "border-border text-muted-foreground"}`}
                      >
                        {status}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
