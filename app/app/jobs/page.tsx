import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { JobApplyForm } from "@/components/jobs/JobApplyForm";
import { JobPostForm } from "@/components/jobs/JobPostForm";
import { updateJobPostStatus } from "@/app/actions/jobs";
import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";
import { getFounderAffiliation } from "@/lib/affiliation";

export const metadata = { title: "Jobs - Webcoin Labs" };

export default async function JobsPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user;
  const isFounderOrAdmin = user.role === "FOUNDER" || user.role === "ADMIN";
  const isBuilderOrAdmin = user.role === "BUILDER" || user.role === "ADMIN";

  const [projects, jobs, myApplications, founderProfile] = await Promise.all([
    isFounderOrAdmin
      ? db.project.findMany({
          where: user.role === "ADMIN" ? {} : { ownerUserId: user.id },
          select: { id: true, name: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
    db.jobPost.findMany({
      where: { status: "OPEN" },
      include: {
        applications: {
          where: { userId: user.id },
          select: { id: true, status: true },
        },
        project: { select: { id: true, name: true } },
        createdBy: {
          select: {
            id: true,
            name: true,
            founderProfile: { select: { companyName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
    isBuilderOrAdmin
      ? db.jobApplication.findMany({
          where: { userId: user.id },
          include: { job: { select: { id: true, title: true, company: true, status: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
    isFounderOrAdmin
      ? db.founderProfile.findUnique({
          where: { userId: user.id },
          select: { companyName: true },
        })
      : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Jobs Marketplace</h1>
        <p className="mt-1 text-muted-foreground">Real founder-posted opportunities for blockchain builders.</p>
      </div>

      {isFounderOrAdmin ? (
        <section className="rounded-2xl border border-border/50 bg-card p-6">
          <h2 className="mb-3 text-lg font-semibold">Post a job</h2>
          <JobPostForm projects={projects} defaultCompany={founderProfile?.companyName ?? undefined} />
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 text-lg font-semibold">Open roles</h2>
        {jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
            No open jobs yet.
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const alreadyApplied = job.applications.length > 0;
              const canEdit = user.role === "ADMIN" || job.createdByUserId === user.id;
              const founderTag = getFounderAffiliation(job.createdBy.founderProfile);
              const companyTag = founderTag ?? { label: job.company, variant: "founder" as const };

              return (
                <div key={job.id} className="rounded-xl border border-border/50 bg-card p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{job.title}</h3>
                        <ProfileAffiliationTag label={companyTag.label} variant={companyTag.variant} />
                        <span className="rounded-full border border-cyan-500/30 px-2 py-0.5 text-[10px] text-cyan-300">
                          {job.roleType.replaceAll("_", " ")}
                        </span>
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                          {job.locationType}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Posted by {job.createdBy.name ?? "Founder"}
                        {job.chainFocus ? ` | ${job.chainFocus}` : ""}
                        {job.compensation ? ` | ${job.compensation}` : ""}
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm">{job.description}</p>
                      {job.skillsRequired.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {job.skillsRequired.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-[11px] text-emerald-300"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                        {job.project ? (
                          <Link href={`/projects/${job.project.id}`} className="text-blue-300">
                            Linked project: {job.project.name}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                    <div className="w-full md:w-[280px]">
                      {isBuilderOrAdmin ? (
                        alreadyApplied ? (
                          <p className="text-xs text-emerald-300">You already applied.</p>
                        ) : (
                          <JobApplyForm jobId={job.id} />
                        )
                      ) : null}
                      {canEdit ? (
                        <form action={updateJobPostStatus.bind(null, job.id, "CLOSED")} className="mt-3">
                          <button type="submit" className="text-xs text-muted-foreground hover:text-foreground">
                            Close job
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {isBuilderOrAdmin ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Your applications</h2>
          {myApplications.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have not applied yet.</p>
          ) : (
            <div className="space-y-2">
              {myApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-card px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{application.job.title}</p>
                    <p className="text-xs text-muted-foreground">{application.job.company}</p>
                  </div>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs">{application.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
