import { notFound } from "next/navigation";
// Note: InvestorProfile schema does not have geoFocus or isActively fields
import { getServerSession } from "@/lib/auth";
import { Building2, FileText, TrendingUp, Users } from "lucide-react";
import {
  getInvestorByCompanyAndUsername,
  getInvestorCompanyPublic,
  getInvestorPublicByUsername,
} from "@/lib/public-profiles";
import { trackProfileView } from "@/lib/profile-views";
import { db } from "@/server/db/client";
import { mapPublicContactMethods } from "@/lib/contact-methods";
import { PrivateProfileState } from "@/components/profile/PrivateProfileState";
import { sendConnectionRequest } from "@/app/actions/connections";
import { PublicProfileHero } from "@/components/public-profile/PublicProfileHero";
import { PublicProfileTabs } from "@/components/public-profile/PublicProfileTabs";
import { ContactMethodCard } from "@/components/public-profile/ContactMethodCard";
import { ConnectRequestCard } from "@/components/public-profile/ConnectRequestCard";
import { PostCard } from "@/components/public-profile/PostCard";
import { ProfileEmptyState } from "@/components/public-profile/ProfileEmptyState";
import Link from "next/link";

// sendConnectionRequest is used by ConnectRequestCard client component
void sendConnectionRequest;

// ────────── Company page sub-component ──────────
function InvestorCompanyPage({
  company,
}: {
  company: {
    name: string;
    description?: string | null;
    website?: string | null;
    linkedin?: string | null;
    twitter?: string | null;
    location?: string | null;
    members: Array<{
      id: string;
      user: {
        name?: string | null;
        username?: string | null;
        investorProfile?: {
          roleTitle?: string | null;
          investorType?: string | null;
          stageFocus?: string[];
          chainFocus?: string[];
          checkSizeMin?: number | null;
          checkSizeMax?: number | null;
          investmentThesis?: string | null;
        } | null;
      };
    }>;
  };
}) {
  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-8">
      {/* Company header */}
      <div className="overflow-hidden rounded-[20px]" style={{ border: "0.5px solid #1e1e24" }}>
        <div className="h-28" style={{ background: "linear-gradient(135deg, #04100c 0%, #0b1a14 40%, #0d0d0f 100%)" }}>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>
        <div className="p-6 space-y-3" style={{ backgroundColor: "#111114" }}>
          <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ backgroundColor: "rgba(52,211,153,0.08)", border: "0.5px solid rgba(52,211,153,0.2)", color: "#34d399" }}>
            <Building2 className="h-3.5 w-3.5" />
            Investor Company
          </div>
          <h1 className="text-[22px] font-bold" style={{ color: "#e4e4e7", letterSpacing: "-0.3px" }}>{company.name}</h1>
          {company.description ? <p className="text-[14px] leading-6" style={{ color: "#a1a1aa" }}>{company.description}</p> : null}
          <div className="flex flex-wrap gap-3">
            {company.website ? <a href={company.website} target="_blank" rel="noreferrer" className="text-[13px] transition-opacity hover:opacity-80" style={{ color: "#34d399" }}>↗ Website</a> : null}
            {company.linkedin ? <a href={company.linkedin} target="_blank" rel="noreferrer" className="text-[13px] transition-opacity hover:opacity-80" style={{ color: "#60a5fa" }}>↗ LinkedIn</a> : null}
            {company.twitter ? <a href={company.twitter} target="_blank" rel="noreferrer" className="text-[13px] transition-opacity hover:opacity-80" style={{ color: "#e4e4e7" }}>↗ X</a> : null}
            {company.location ? <span className="text-[13px]" style={{ color: "#52525b" }}>📍 {company.location}</span> : null}
          </div>
        </div>
      </div>

      {/* Members */}
      <div>
        <p className="mb-3 text-[11px] uppercase tracking-[0.18em]" style={{ color: "#52525b" }}>Affiliated Investors</p>
        {company.members.length === 0 ? (
          <ProfileEmptyState icon={Users} title="No public investor members yet" />
        ) : (
          <div className="space-y-3">
            {company.members.map((member) => {
              const ip = member.user.investorProfile;
              return (
                <div key={member.id} className="rounded-[14px] p-4" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[15px] font-semibold" style={{ color: "#e4e4e7" }}>{member.user.name ?? "Investor"}</p>
                      {member.user.username ? (
                        <Link href={`/investor/${member.user.username}`} className="text-[12px] transition-opacity hover:opacity-80" style={{ color: "#34d399" }}>
                          @{member.user.username} →
                        </Link>
                      ) : null}
                    </div>
                    {ip?.investorType ? (
                      <span className="rounded-full px-2.5 py-1 text-[11px]" style={{ backgroundColor: "rgba(52,211,153,0.08)", border: "0.5px solid rgba(52,211,153,0.2)", color: "#34d399" }}>
                        {ip.investorType}
                      </span>
                    ) : null}
                  </div>
                  {ip ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(ip.stageFocus ?? []).map((s) => (
                        <span key={s} className="rounded-full px-2 py-0.5 text-[10px]" style={{ backgroundColor: "#1a1a1e", border: "0.5px solid #27272a", color: "#71717a" }}>{s}</span>
                      ))}
                      {(ip.chainFocus ?? []).map((c) => (
                        <span key={c} className="rounded-full px-2 py-0.5 text-[10px]" style={{ backgroundColor: "rgba(52,211,153,0.06)", border: "0.5px solid rgba(52,211,153,0.15)", color: "#34d399" }}>{c}</span>
                      ))}
                      {(ip.checkSizeMin ?? ip.checkSizeMax) ? (
                        <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ backgroundColor: "#1a1a1e", border: "0.5px solid #27272a", color: "#71717a" }}>
                          ${ip.checkSizeMin ?? 0}–${ip.checkSizeMax ?? 0}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {ip?.investmentThesis ? (
                    <p className="mt-2 text-[13px] leading-5 line-clamp-2" style={{ color: "#71717a" }}>{ip.investmentThesis}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Link href="/" className="block text-[12px] transition-opacity hover:opacity-80" style={{ color: "#52525b" }}>
        ← Back to Webcoin Labs
      </Link>
    </main>
  );
}

// ────────── Individual investor page ──────────
export default async function InvestorPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ segments?: string[] }>;
  searchParams?: Promise<{ connect?: string; source?: string; viewerRole?: string }>;
}) {
  const { segments = [] } = await params;
  const resolvedSearch = (await searchParams) ?? {};
  const session = await getServerSession();
  const viewer = { userId: session?.user?.id, role: session?.user?.role };

  if (segments.length === 0) notFound();

  // ── 1-segment: username OR company slug ──
  if (segments.length === 1) {
    const [segment] = segments;
    const [investor, company] = await Promise.all([
      getInvestorPublicByUsername(segment, viewer),
      getInvestorCompanyPublic(segment),
    ]);

    if (company) return <InvestorCompanyPage company={company} />;

    if (!investor || !investor.investorProfile) {
      const privateCandidate = await db.user.findFirst({
        where: { username: segment.toLowerCase(), investorProfile: { isNot: null } },
        select: { username: true, publicProfileSettings: { select: { openToConnections: true } } },
      });
      if (privateCandidate?.username) {
        return (
          <PrivateProfileState
            username={privateCandidate.username}
            roleLabel="Investor"
            openToConnections={privateCandidate.publicProfileSettings?.openToConnections ?? true}
            source={resolvedSearch.source}
            viewerRole={resolvedSearch.viewerRole}
          />
        );
      }
      notFound();
    }
    await trackProfileView({
      viewerUserId: session?.user?.id,
      viewedUserId: investor.id,
      source: "public_profile_investor",
      roleContext: session?.user?.role ?? null,
    });

    const openToConnections = investor.publicProfileSettings?.openToConnections ?? true;
    const publicContactMethods = openToConnections ? mapPublicContactMethods(investor.profileContactMethods ?? []) : [];
    const recentPosts = await db.feedPost.findMany({
      where: { authorUserId: investor.id, visibility: "PUBLIC" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const ip = investor.investorProfile;

    const contactCards = publicContactMethods.map((m) => ({ type: m.type ?? "WEBSITE", label: m.label, href: m.href }));

    const statusChips: { label: string; color?: "amber" | "green" | "violet" | "cyan" | "default" }[] = [
      ...(ip.isPublic ? [{ label: "Public Profile", color: "green" as const }] : []),
      ...(ip.investorType ? [{ label: ip.investorType, color: "default" as const }] : []),
    ];

    const checkRange =
      ip.checkSizeMin !== null || ip.checkSizeMax !== null
        ? `$${ip.checkSizeMin ?? 0}–$${ip.checkSizeMax ?? 0}`
        : null;

    const tabs = [
      {
        key: "overview",
        label: "Overview",
        content: (
          <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
            <div className="space-y-3">
              {investor.bio ? (
                <div className="rounded-[14px] p-4" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
                  <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#52525b" }}>About</p>
                  <p className="mt-2 text-[14px] leading-6" style={{ color: "#a1a1aa" }}>{investor.bio}</p>
                </div>
              ) : null}
              {/* Thesis summary */}
              {ip.investmentThesis ? (
                <div className="rounded-[14px] p-4" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
                  <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#52525b" }}>Investment Thesis</p>
                  <p className="mt-2 text-[14px] leading-6" style={{ color: "#a1a1aa" }}>{ip.investmentThesis}</p>
                </div>
              ) : null}
              {/* Focus areas */}
              {((ip.stageFocus?.length ?? 0) > 0 || (ip.chainFocus?.length ?? 0) > 0 || (ip.sectorFocus?.length ?? 0) > 0) ? (
                <div className="rounded-[14px] p-4" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
                  <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#52525b" }}>Focus Areas</p>
                  <div className="mt-3 space-y-2">
                    {(ip.stageFocus ?? []).length > 0 ? (
                      <div>
                        <p className="text-[10px]" style={{ color: "#3f3f46" }}>Stage</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {(ip.stageFocus ?? []).map((s) => (
                            <span key={s} className="rounded-full px-2.5 py-1 text-[11px]" style={{ backgroundColor: "rgba(52,211,153,0.06)", border: "0.5px solid rgba(52,211,153,0.15)", color: "#34d399" }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {(ip.chainFocus ?? []).length > 0 ? (
                      <div>
                        <p className="text-[10px]" style={{ color: "#3f3f46" }}>Chain</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {(ip.chainFocus ?? []).map((c) => (
                            <span key={c} className="rounded-full px-2.5 py-1 text-[11px]" style={{ backgroundColor: "#1a1a1e", border: "0.5px solid #27272a", color: "#71717a" }}>{c}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {(ip.sectorFocus ?? []).length > 0 ? (
                      <div>
                        <p className="text-[10px]" style={{ color: "#3f3f46" }}>Sector</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {(ip.sectorFocus ?? []).map((s) => (
                            <span key={s} className="rounded-full px-2.5 py-1 text-[11px]" style={{ backgroundColor: "rgba(167,139,250,0.06)", border: "0.5px solid rgba(167,139,250,0.15)", color: "#a78bfa" }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
            {/* Sidebar */}
            <div className="space-y-4">
              <ConnectRequestCard
                toUserId={investor.id}
                toUsername={investor.username ?? ""}
                source={resolvedSearch.source ?? "public-profile-investor"}
                openToConnections={openToConnections}
                isLoggedIn={Boolean(session?.user?.id)}
                isSelf={session?.user?.id === investor.id}
              />
              <div className="rounded-[16px] p-4 space-y-2" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
                <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#52525b" }}>Quick Facts</p>
                {ip.firmName ?? ip.company?.name ? (
                  <p className="text-[13px]" style={{ color: "#a1a1aa" }}>
                    <span style={{ color: "#3f3f46" }}>Fund / Firm: </span>
                    {ip.firmName ?? ip.company?.name}
                  </p>
                ) : null}
                {checkRange ? (
                  <p className="text-[13px]" style={{ color: "#a1a1aa" }}>
                    <span style={{ color: "#3f3f46" }}>Check size: </span>{checkRange}
                  </p>
                ) : null}
  
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "thesis",
        label: "Thesis",
        content: (
          <div className="space-y-4">
            {ip.investmentThesis ? (
              <div className="rounded-[16px] p-6" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
                <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#52525b" }}>Investment Thesis</p>
                <p className="mt-3 text-[14px] leading-7" style={{ color: "#a1a1aa" }}>{ip.investmentThesis}</p>
              </div>
            ) : (
              <ProfileEmptyState icon={TrendingUp} title="No thesis published" description="This investor has not published their investment thesis publicly yet." />
            )}
          </div>
        ),
      },
      {
        key: "posts",
        label: "Posts",
        content: (
          <div className="space-y-3">
            {recentPosts.length === 0 ? (
              <ProfileEmptyState icon={FileText} title="No public posts yet" description="Updates shared by this investor will appear here once published." />
            ) : (
              recentPosts.map((post) => (
                <PostCard key={post.id} postType={post.postType} title={post.title}
                  body={(post as { body?: string | null }).body} createdAt={post.createdAt} />
              ))
            )}
          </div>
        ),
      },
      {
        key: "open-calls",
        label: "Open Calls",
        content: (
          <div className="space-y-3">
            {ip.isPublic ? (
              <div className="rounded-[14px] p-4 space-y-3" style={{ backgroundColor: "rgba(52,211,153,0.05)", border: "0.5px solid rgba(52,211,153,0.2)" }}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" style={{ color: "#34d399" }} />
                  <p className="text-[13px] font-semibold" style={{ color: "#34d399" }}>Actively Investing</p>
                </div>
                <p className="text-[13px] leading-5" style={{ color: "#a1a1aa" }}>
                  This investor is currently evaluating deals. Use the contact methods to submit your intro or reach out directly.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(ip.stageFocus ?? []).map((s) => (
                    <span key={s} className="rounded-full px-2.5 py-1 text-[11px]" style={{ backgroundColor: "rgba(52,211,153,0.08)", border: "0.5px solid rgba(52,211,153,0.25)", color: "#34d399" }}>{s}</span>
                  ))}
                </div>
                {checkRange ? (
                  <p className="text-[12px]" style={{ color: "#71717a" }}>Typical check size: {checkRange}</p>
                ) : null}
              </div>
            ) : (
              <ProfileEmptyState icon={TrendingUp} title="Profile not fully public" description="This investor has not enabled their full public profile yet." />
            )}
          </div>
        ),
      },
      {
        key: "contact",
        label: "Contact",
        content: (
          <div className="space-y-4">
            {contactCards.length === 0 ? (
              <ProfileEmptyState icon={Users} title="No public contact methods"
                description="This investor has not exposed external contact links publicly. You can still send a connection request." />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {contactCards.map((m) => (
                  <ContactMethodCard key={`${m.type}-${m.href}`} type={m.type} label={m.label} href={m.href} />
                ))}
              </div>
            )}
            <ConnectRequestCard
              toUserId={investor.id}
              toUsername={investor.username ?? ""}
              source={resolvedSearch.source ?? "public-profile-investor"}
              openToConnections={openToConnections}
              isLoggedIn={Boolean(session?.user?.id)}
              isSelf={session?.user?.id === investor.id}
            />
          </div>
        ),
      },
    ];

    return (
      <main className="mx-auto max-w-4xl space-y-5 px-4 py-8">
        <PublicProfileHero
          role="investor"
          name={investor.name ?? "Investor"}
          username={investor.username ?? ""}
          image={investor.image}
          bio={investor.bio}
          statusChips={statusChips}
          sharePath={`/investor/${investor.username ?? segment}`}
        />
        <PublicProfileTabs tabs={tabs} accent="#34d399" />
      </main>
    );
  }

  // ── 2-segments: company/username ──
  if (segments.length === 2) {
    const [companySlug, username] = segments;
    const investor = await getInvestorByCompanyAndUsername(companySlug, username, viewer);
    if (!investor || !investor.investorProfile) {
      const privateCandidate = await db.user.findFirst({
        where: { username: username.toLowerCase(), investorProfile: { isNot: null } },
        select: { username: true, publicProfileSettings: { select: { openToConnections: true } } },
      });
      if (privateCandidate?.username) {
        return (
          <PrivateProfileState
            username={privateCandidate.username}
            roleLabel="Investor"
            openToConnections={privateCandidate.publicProfileSettings?.openToConnections ?? true}
            source={resolvedSearch.source}
            viewerRole={resolvedSearch.viewerRole}
          />
        );
      }
      notFound();
    }
    await trackProfileView({
      viewerUserId: session?.user?.id,
      viewedUserId: investor.id,
      source: "public_profile_investor_company",
      roleContext: session?.user?.role ?? null,
    });
    const ip = investor.investorProfile;
    return (
      <main className="mx-auto max-w-4xl space-y-5 px-4 py-8">
        <PublicProfileHero
          role="investor"
          name={investor.name ?? "Investor"}
          username={investor.username ?? ""}
          image={investor.image}
          bio={investor.bio}
          statusChips={ip.investorType ? [{ label: ip.investorType, color: "default" }] : []}
          sharePath={`/investor/${companySlug}/${investor.username ?? username}`}
        />
        <div className="rounded-[14px] p-4" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
          <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#52525b" }}>Firm</p>
          <p className="mt-2 text-[15px] font-semibold" style={{ color: "#e4e4e7" }}>{ip.company?.name ?? ip.firmName ?? "Independent"}</p>
          {ip.investmentThesis ? <p className="mt-2 text-[13px] leading-5" style={{ color: "#a1a1aa" }}>{ip.investmentThesis}</p> : null}
        </div>
      </main>
    );
  }

  notFound();
}
