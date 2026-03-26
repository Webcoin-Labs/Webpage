import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { ArrowLeft } from "lucide-react";
import { ModerationBuilders } from "@/components/app/ModerationBuilders";
import { ModerationProjects } from "@/components/app/ModerationProjects";
import { CompanyLogo } from "@/components/common/CompanyLogo";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";

export const metadata = { title: "Moderation - Admin | Webcoin Labs" };

export default async function AdminModerationPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/app");

  const [builders, projects, founderProfiles, imageUsers, hiringInterests] = await Promise.all([
    db.builderProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
            imageStorageKey: true,
            imageMimeType: true,
            imageSize: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.project.findMany({
      include: { owner: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.founderProfile.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      take: 120,
    }),
    db.user.findMany({
      where: { image: { not: null } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        imageStorageKey: true,
        imageMimeType: true,
        imageSize: true,
        imageWidth: true,
        imageHeight: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 120,
    }),
    db.hiringInterest.findMany({
      include: { founder: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
  ]);

  return (
    <div className="space-y-8 py-8">
      <Link href="/app/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Admin
      </Link>
      <h1 className="text-2xl font-bold">Moderation</h1>
      <p className="text-sm text-muted-foreground">
        Manage visibility, verification, founder company identity completeness, upload quality, and hiring submissions.
      </p>

      <ModerationBuilders builders={builders} />
      <ModerationProjects projects={projects} />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Founder company identity</h2>
          <Link href="/app/admin/hiring-interests" className="text-xs text-blue-300">
            Open hiring inbox
          </Link>
        </div>
        {founderProfiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No founder profiles yet.</p>
        ) : (
          founderProfiles.map((founder) => {
            const completionFields = [
              founder.companyName,
              founder.companyDescription,
              founder.roleTitle,
              founder.companyLogoUrl,
              founder.website,
              founder.chainFocus,
              founder.projectStage,
            ];
            const completion = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);
            const suspiciousLogoPath = Boolean(
              founder.companyLogoStorageKey &&
              founder.companyLogoUrl &&
              !founder.companyLogoUrl.startsWith("/"),
            );

            return (
              <div key={founder.id} className="rounded-xl border border-border/50 bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <CompanyLogo
                      src={founder.companyLogoUrl}
                      alt={founder.companyName ?? "Company"}
                      fallback={founder.companyName ?? "Company"}
                      className="h-12 w-12 rounded-xl border border-border/60 bg-background p-1"
                      fallbackClassName="rounded-xl border border-border/60 bg-background text-sm text-muted-foreground"
                      imgClassName="p-1"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{founder.user.name ?? founder.user.email}</p>
                        <ProfileAffiliationTag label={founder.companyName} variant="founder" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {founder.roleTitle ?? "No title"}
                        {founder.chainFocus ? ` | ${founder.chainFocus}` : ""}
                        {founder.projectStage ? ` | ${founder.projectStage}` : ""}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {founder.companyLogoMimeType ?? "no-logo-mime"}
                        {founder.companyLogoSize ? ` | ${Math.round(founder.companyLogoSize / 1024)}KB` : ""}
                        {founder.companyLogoStorageKey ? ` | ${founder.companyLogoStorageKey}` : " | external-or-empty"}
                        {suspiciousLogoPath ? " | suspicious-path" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                      {completion}% complete
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 ${
                        founder.isHiring ? "border-emerald-500/30 text-emerald-300" : "border-border text-muted-foreground"
                      }`}
                    >
                      {founder.isHiring ? "Hiring" : "Not hiring"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Uploaded profile images</h2>
        {imageUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No profile images uploaded yet.</p>
        ) : (
          imageUsers.map((u) => {
            const suspicious = Boolean(
              u.imageStorageKey &&
                u.image &&
                !u.image.startsWith("/") &&
                !/^https?:\/\//i.test(u.image)
            );
            return (
              <div key={u.id} className="rounded-xl border border-border/50 bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar
                      src={u.image}
                      alt={u.name ?? "User"}
                      fallback={(u.name ?? u.email ?? "U").charAt(0)}
                      className="h-10 w-10 rounded-full border border-border/60"
                      fallbackClassName="bg-cyan-500/10 text-sm text-cyan-300"
                    />
                    <div>
                      <p className="text-sm font-medium">{u.name ?? u.email}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {u.imageMimeType ?? "unknown"}
                    {u.imageSize ? ` | ${Math.round(u.imageSize / 1024)}KB` : " | size n/a"}
                    {u.imageWidth && u.imageHeight ? ` | ${u.imageWidth}x${u.imageHeight}` : ""}
                    {u.imageStorageKey ? ` | ${u.imageStorageKey}` : " | external URL"}
                    {suspicious ? " | suspicious-path" : ""}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent hiring-interest submissions</h2>
        {hiringInterests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          hiringInterests.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {entry.name} | {entry.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Founder: {entry.founder.name ?? entry.founder.email ?? "Unknown"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{entry.skills}</p>
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                  {entry.status}
                </span>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
