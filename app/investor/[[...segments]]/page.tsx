import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Building2, Globe2, Wallet } from "lucide-react";
import {
  getInvestorByCompanyAndUsername,
  getInvestorCompanyPublic,
  getInvestorPublicByUsername,
} from "@/lib/public-profiles";
import { authOptions } from "@/lib/auth";

function InvestorCard({
  name,
  username,
  roleTitle,
  investorType,
  stageFocus,
  chainFocus,
  checkRange,
  thesis,
}: {
  name: string;
  username?: string | null;
  roleTitle?: string | null;
  investorType?: string | null;
  stageFocus?: string[];
  chainFocus?: string[];
  checkRange?: string;
  thesis?: string | null;
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-4">
      <p className="text-lg font-semibold">{name}</p>
      {username ? <p className="text-xs text-muted-foreground">@{username}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        {investorType ? <span className="rounded-full border border-border px-2 py-1">{investorType}</span> : null}
        {roleTitle ? <span className="rounded-full border border-border px-2 py-1">{roleTitle}</span> : null}
        {checkRange ? <span className="rounded-full border border-border px-2 py-1">Check size: {checkRange}</span> : null}
      </div>
      {stageFocus && stageFocus.length > 0 ? <p className="mt-2 text-xs text-muted-foreground">Stage focus: {stageFocus.join(", ")}</p> : null}
      {chainFocus && chainFocus.length > 0 ? <p className="text-xs text-muted-foreground">Chain focus: {chainFocus.join(", ")}</p> : null}
      {thesis ? <p className="mt-2 text-xs text-muted-foreground">{thesis}</p> : null}
    </section>
  );
}

export default async function InvestorPublicPage({ params }: { params: Promise<{ segments?: string[] }> }) {
  const { segments = [] } = await params;
  const session = await getServerSession(authOptions);
  const viewer = {
    userId: session?.user?.id,
    role: session?.user?.role,
  };

  if (segments.length === 0) notFound();

  if (segments.length === 1) {
    const [segment] = segments;
    const [investor, company] = await Promise.all([
      getInvestorPublicByUsername(segment, viewer),
      getInvestorCompanyPublic(segment),
    ]);

    if (company) {
      return (
        <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
          <section className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-200">
              <Building2 className="h-3.5 w-3.5" />
              Investor Company Public Page
            </div>
            <h1 className="text-2xl font-semibold">{company.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{company.description ?? "No public description yet."}</p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              {company.website ? <p>Website: {company.website}</p> : null}
              {company.linkedin ? <p>LinkedIn: {company.linkedin}</p> : null}
              {company.twitter ? <p>X: {company.twitter}</p> : null}
              {company.location ? <p>Location: {company.location}</p> : null}
            </div>
          </section>
          <section className="space-y-2">
            <p className="text-sm font-semibold">Affiliated Investors</p>
            {company.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No public investor members yet.</p>
            ) : (
              company.members.map((member) => (
                <InvestorCard
                  key={member.id}
                  name={member.user.name ?? "Investor"}
                  username={member.user.username}
                  roleTitle={member.user.investorProfile?.roleTitle}
                  investorType={member.user.investorProfile?.investorType ?? undefined}
                  stageFocus={member.user.investorProfile?.stageFocus}
                  chainFocus={member.user.investorProfile?.chainFocus}
                  checkRange={
                    member.user.investorProfile?.checkSizeMin !== null || member.user.investorProfile?.checkSizeMax !== null
                      ? `${member.user.investorProfile?.checkSizeMin ?? 0} - ${member.user.investorProfile?.checkSizeMax ?? 0}`
                      : undefined
                  }
                  thesis={member.user.investorProfile?.investmentThesis}
                />
              ))
            )}
          </section>
          <div className="text-xs text-muted-foreground">
            <Link href="/" className="text-cyan-300">
              Back to Webcoin Labs
            </Link>
          </div>
        </main>
      );
    }

    if (!investor || !investor.investorProfile) notFound();

    return (
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        <section className="rounded-2xl border border-border/60 bg-card p-6">
          <p className="text-xs text-cyan-300">Investor Public Profile</p>
          <h1 className="mt-1 text-2xl font-semibold">{investor.name ?? "Investor"}</h1>
          <p className="text-sm text-muted-foreground">@{investor.username}</p>
        </section>
        <InvestorCard
          name={investor.name ?? "Investor"}
          username={investor.username}
          roleTitle={investor.investorProfile.roleTitle}
          investorType={investor.investorProfile.investorType}
          stageFocus={investor.investorProfile.stageFocus}
          chainFocus={investor.investorProfile.chainFocus}
          checkRange={
            investor.investorProfile.checkSizeMin !== null || investor.investorProfile.checkSizeMax !== null
              ? `${investor.investorProfile.checkSizeMin ?? 0} - ${investor.investorProfile.checkSizeMax ?? 0}`
              : undefined
          }
          thesis={investor.investorProfile.investmentThesis}
        />
        <section className="rounded-xl border border-border/60 bg-card p-4 text-xs text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Globe2 className="h-4 w-4 text-cyan-300" /> Company/Fund
          </div>
          <p>{investor.investorProfile.company?.name ?? investor.investorProfile.firmName ?? "Independent investor"}</p>
        </section>
        <section className="rounded-xl border border-border/60 bg-card p-4 text-xs text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Wallet className="h-4 w-4 text-cyan-300" /> Wallet
          </div>
          {investor.walletConnections.length === 0 ? <p>No public wallet linked.</p> : investor.walletConnections.map((wallet) => <p key={wallet.id}>{wallet.network}: {wallet.address}</p>)}
        </section>
      </main>
    );
  }

  if (segments.length === 2) {
    const [companySlug, username] = segments;
    const investor = await getInvestorByCompanyAndUsername(companySlug, username, viewer);
    if (!investor || !investor.investorProfile) notFound();

    return (
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        <section className="rounded-2xl border border-border/60 bg-card p-6">
          <p className="text-xs text-cyan-300">Firm-Affiliated Investor</p>
          <h1 className="mt-1 text-2xl font-semibold">{investor.name ?? "Investor"}</h1>
          <p className="text-sm text-muted-foreground">
            @{investor.username} • {investor.investorProfile.company?.name}
          </p>
        </section>
        <InvestorCard
          name={investor.name ?? "Investor"}
          username={investor.username}
          roleTitle={investor.investorProfile.roleTitle}
          investorType={investor.investorProfile.investorType}
          stageFocus={investor.investorProfile.stageFocus}
          chainFocus={investor.investorProfile.chainFocus}
          checkRange={
            investor.investorProfile.checkSizeMin !== null || investor.investorProfile.checkSizeMax !== null
              ? `${investor.investorProfile.checkSizeMin ?? 0} - ${investor.investorProfile.checkSizeMax ?? 0}`
              : undefined
          }
          thesis={investor.investorProfile.investmentThesis}
        />
      </main>
    );
  }

  notFound();
}
