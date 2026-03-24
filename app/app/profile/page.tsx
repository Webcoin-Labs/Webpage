import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { BuilderProfileForm } from "@/components/app/BuilderProfileForm";
import { FounderProfileForm } from "@/components/app/FounderProfileForm";
import { InvestorProfileForm } from "@/components/app/InvestorProfileForm";
import { getBuilderAffiliation, getFounderAffiliation } from "@/lib/affiliation";
import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import { CompanyLogo } from "@/components/common/CompanyLogo";
import { linkFounderBuilderIdentity, setContactVisibility } from "@/app/actions/founder-os-expansion";

export const metadata = { title: "Profile - Webcoin Labs" };

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const user = session!.user;

  const [builderProfile, founderProfile, investorProfile] = await Promise.all([
    db.builderProfile.findUnique({ where: { userId: user.id } }),
    db.founderProfile.findUnique({ where: { userId: user.id } }),
    db.investorProfile.findUnique({ where: { userId: user.id } }),
  ]);
  const publicSettings = await db.publicProfileSettings.findUnique({ where: { userId: user.id } });

  const builderAffiliation = getBuilderAffiliation(builderProfile);
  const founderAffiliation = getFounderAffiliation(founderProfile);
  const investorAffiliation = investorProfile?.firmName?.trim()
    ? { label: investorProfile.firmName.trim(), variant: "default" as const }
    : null;
  const founderCompanyName = founderProfile?.companyName?.trim();
  const founderHasValidCompany = Boolean(founderCompanyName && founderCompanyName.toLowerCase() !== "check");

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
                {user.role === "FOUNDER" && founderHasValidCompany && founderAffiliation ? (
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
                {user.role === "FOUNDER" && founderProfile?.roleTitle ? ` ${founderProfile.roleTitle}.` : ""}
                {user.role === "FOUNDER"
                  ? ` ${founderProfile?.publicVisible === false ? "Currently private." : "Currently public."}`
                  : ""}
              </p>
            </div>
          </div>
          {user.role === "FOUNDER" ? (
            <div className="flex items-center gap-3">
              <CompanyLogo
                src={founderProfile?.companyLogoUrl}
                alt={founderProfile?.companyName ?? "Company"}
                fallback={founderHasValidCompany ? founderCompanyName ?? "Company" : "Company"}
                className="h-11 w-11 rounded-xl border border-border/60 bg-background p-1"
                fallbackClassName="rounded-xl border border-border/60 bg-background text-sm text-muted-foreground"
                imgClassName="p-1"
              />
              <div className="text-right text-xs text-muted-foreground">
                <p>{founderProfile?.roleTitle ?? "Founder"}</p>
                <p>{founderProfile?.isHiring ? "Hiring active" : "Hiring paused"}</p>
                <p>{founderProfile?.publicVisible === false ? "Private profile" : "Public profile"}</p>
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

      <section className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="text-base font-semibold">Contact Visibility (Investor-only)</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Control whether Telegram, LinkedIn, and email are visible to authenticated investors on your public pages.
        </p>
        <form
          action={async (formData: FormData) => {
            "use server";
            await setContactVisibility(formData);
          }}
          className="mt-3 space-y-2"
        >
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="showTelegramToInvestors"
              value="true"
              defaultChecked={publicSettings?.showTelegramToInvestors ?? true}
              className="accent-cyan-500"
            />
            Show Telegram to investors
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="showLinkedinToInvestors"
              value="true"
              defaultChecked={publicSettings?.showLinkedinToInvestors ?? true}
              className="accent-cyan-500"
            />
            Show LinkedIn to investors
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="showEmailToInvestors"
              value="true"
              defaultChecked={publicSettings?.showEmailToInvestors ?? false}
              className="accent-cyan-500"
            />
            Show email to investors
          </label>
          <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
            Save contact visibility
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="text-base font-semibold">Link Founder / Builder Profile</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Link a counterpart profile by username to display “Also Founder/Also Builder” cross-links publicly.
        </p>
        <form
          action={async (formData: FormData) => {
            "use server";
            await linkFounderBuilderIdentity(formData);
          }}
          className="mt-3 flex gap-2"
        >
          <input name="toUsername" placeholder="Counterpart username" className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" />
          <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
            Link profile
          </button>
        </form>
      </section>
    </div>
  );
}
