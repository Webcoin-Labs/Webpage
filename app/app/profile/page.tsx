import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BuilderProfileForm } from "@/components/app/BuilderProfileForm";
import { FounderProfileForm } from "@/components/app/FounderProfileForm";
import { InvestorProfileForm } from "@/components/app/InvestorProfileForm";
import { getBuilderAffiliation, getFounderAffiliation } from "@/lib/affiliation";
import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import { CompanyLogo } from "@/components/common/CompanyLogo";

export const metadata = { title: "Profile - Webcoin Labs" };

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const user = session!.user;

  const [builderProfile, founderProfile, investorProfile] = await Promise.all([
    prisma.builderProfile.findUnique({ where: { userId: user.id } }),
    prisma.founderProfile.findUnique({ where: { userId: user.id } }),
    prisma.investorProfile.findUnique({ where: { userId: user.id } }),
  ]);

  const builderAffiliation = getBuilderAffiliation(builderProfile);
  const founderAffiliation = getFounderAffiliation(founderProfile);
  const investorAffiliation = investorProfile?.firmName?.trim()
    ? { label: investorProfile.firmName.trim(), variant: "default" as const }
    : null;

  const roleLabel =
    user.role === "FOUNDER"
      ? "founder"
      : user.role === "BUILDER"
        ? "builder"
        : user.role === "INVESTOR"
          ? "investor"
          : "member";

  return (
    <div className="space-y-6 py-8">
      <section className="rounded-2xl border border-border/50 bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <ProfileAvatar
              src={user.image}
              alt={user.name ?? "User"}
              fallback={user.name?.charAt(0) ?? "U"}
              className="h-12 w-12 rounded-xl"
              fallbackClassName="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-lg text-cyan-300"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold">{user.name ?? "Profile"}</h1>
                {user.role === "FOUNDER" && founderAffiliation ? (
                  <ProfileAffiliationTag label={founderAffiliation.label} variant={founderAffiliation.variant} />
                ) : null}
                {user.role === "BUILDER" ? (
                  <ProfileAffiliationTag label={builderAffiliation.label} variant={builderAffiliation.variant} />
                ) : null}
                {user.role === "INVESTOR" && investorAffiliation ? (
                  <ProfileAffiliationTag label={investorAffiliation.label} variant="default" />
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Your {roleLabel} profile visible to the Webcoin Labs network.
              </p>
            </div>
          </div>
          {user.role === "FOUNDER" ? (
            <div className="flex items-center gap-3">
              <CompanyLogo
                src={founderProfile?.companyLogoUrl}
                alt={founderProfile?.companyName ?? "Company"}
                fallback={founderProfile?.companyName ?? "Company"}
                className="h-11 w-11 rounded-xl border border-border/60 bg-background p-1"
                fallbackClassName="rounded-xl border border-border/60 bg-background text-sm text-muted-foreground"
                imgClassName="p-1"
              />
              <div className="text-right text-xs text-muted-foreground">
                <p>{founderProfile?.roleTitle ?? "Founder"}</p>
                <p>{founderProfile?.isHiring ? "Hiring active" : "Hiring paused"}</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {user.role === "BUILDER" ? <BuilderProfileForm initial={builderProfile} /> : null}
      {user.role === "FOUNDER" ? <FounderProfileForm initial={founderProfile} /> : null}
      {user.role === "INVESTOR" ? <InvestorProfileForm initial={investorProfile} /> : null}
      {user.role !== "BUILDER" && user.role !== "FOUNDER" && user.role !== "INVESTOR" ? (
        <div className="rounded-xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
          Profile setup is available for Builder, Founder, and Investor roles.
        </div>
      ) : null}
    </div>
  );
}
