import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { Briefcase, FileText, Globe, Users } from "lucide-react";
import { getFounderPublicProfile } from "@/lib/public-profiles";
import { canViewerAccessInvestorOnlyContacts, normalizeTelegramUrl } from "@/lib/contact-visibility";
import { trackProfileView } from "@/lib/profile-views";
import { db } from "@/server/db/client";
import { mapPublicContactMethods } from "@/lib/contact-methods";
import { PrivateProfileState } from "@/components/profile/PrivateProfileState";
import { sendConnectionRequest } from "@/app/actions/connections";
import { PublicProfileHero } from "@/components/public-profile/PublicProfileHero";
import { PublicProfileTabs } from "@/components/public-profile/PublicProfileTabs";
import { ContactMethodCard } from "@/components/public-profile/ContactMethodCard";
import { ConnectRequestCard } from "@/components/public-profile/ConnectRequestCard";
import { VentureCard } from "@/components/public-profile/VentureCard";
import { PostCard } from "@/components/public-profile/PostCard";
import { ProfileEmptyState } from "@/components/public-profile/ProfileEmptyState";

export default async function FounderPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{ connect?: string; source?: string; viewerRole?: string }>;
}) {
  const { username } = await params;
  const resolvedSearch = (await searchParams) ?? {};
  const session = await getServerSession();
  const viewerIsInvestor = canViewerAccessInvestorOnlyContacts(session?.user?.role);
  const profile = await getFounderPublicProfile(username, {
    userId: session?.user?.id,
    role: session?.user?.role,
  });
  if (!profile || !profile.founderProfile) {
    const privateCandidate = await db.user.findFirst({
      where: { username: username.toLowerCase(), founderProfile: { isNot: null } },
      select: { username: true, publicProfileSettings: { select: { openToConnections: true } } },
    });
    if (privateCandidate?.username) {
      return (
        <PrivateProfileState
          username={privateCandidate.username}
          roleLabel="Founder"
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
    viewedUserId: profile.id,
    source: "public_profile_founder",
    roleContext: session?.user?.role ?? null,
  });
  const recentPosts = await db.feedPost.findMany({
    where: { authorUserId: profile.id, visibility: "PUBLIC" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const openToConnections = profile.publicProfileSettings?.openToConnections ?? true;
  const publicContactMethods = openToConnections ? mapPublicContactMethods(profile.profileContactMethods ?? []) : [];
  const linkedBuilder =
    profile.builderProfile
      ? { username: profile.username, name: profile.name }
      : profile.profileLinksFrom.find((link) => link.toUser.builderProfile)?.toUser;
  const showTelegram =
    viewerIsInvestor && (profile.publicProfileSettings?.showTelegramToInvestors ?? true) && Boolean(profile.founderProfile.telegram);
  const showLinkedin =
    viewerIsInvestor && (profile.publicProfileSettings?.showLinkedinToInvestors ?? true) && Boolean(profile.founderProfile.linkedin);
  const showEmail =
    viewerIsInvestor && (profile.publicProfileSettings?.showEmailToInvestors ?? false) && Boolean(profile.email);

  // Build contact methods list for the Contact tab
  const contactCards: { type: string; label: string; href: string }[] = [
    ...(showTelegram && profile.founderProfile.telegram
      ? [{ type: "TELEGRAM", label: "Telegram", href: normalizeTelegramUrl(profile.founderProfile.telegram) ?? "#" }]
      : []),
    ...(showLinkedin && profile.founderProfile.linkedin
      ? [{ type: "LINKEDIN", label: "LinkedIn", href: profile.founderProfile.linkedin }]
      : []),
    ...(showEmail && profile.email
      ? [{ type: "EMAIL", label: "Email", href: `mailto:${profile.email}` }]
      : []),
    ...publicContactMethods.map((m) => ({ type: m.type ?? "WEBSITE", label: m.label, href: m.href })),
  ];

  const fp = profile.founderProfile;
  const statusChips: { label: string; color?: "amber" | "green" | "violet" | "cyan" | "default" }[] = [
    ...(fp.isHiring ? [{ label: "Hiring", color: "amber" as const }] : []),
    ...(String(fp.projectStage) === "FUNDRAISING" ? [{ label: "Raising", color: "green" as const }] : []),
    ...((fp.lookingFor ?? []).map((lf) => ({ label: lf, color: "violet" as const }))),
  ];

  const tabs = [
    {
      key: "overview",
      label: "Overview",
      content: (
        <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
          <div className="space-y-3">
            {/* About */}
            {profile.bio ? (
              <div className="rounded-[14px] p-4" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
                <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "#52525b" }}>About</p>
                <p className="mt-1.5 text-[13px] leading-[1.6]" style={{ color: "#a1a1aa" }}>{profile.bio}</p>
              </div>
            ) : null}
            {/* Venture identity */}
            {fp.companyDescription || fp.companyName ? (
              <div className="rounded-[14px] p-4" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
                <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "#52525b" }}>Venture Identity</p>
                {fp.companyName ? <p className="mt-1.5 text-[15px] font-semibold" style={{ color: "#e4e4e7" }}>{fp.companyName}</p> : null}
                {fp.companyDescription ? <p className="mt-1 text-[13px] leading-[1.6]" style={{ color: "#a1a1aa" }}>{fp.companyDescription}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {fp.projectStage ? (
                    <span className="rounded-full px-2.5 py-1 text-[11px]" style={{ backgroundColor: "rgba(167,139,250,0.08)", border: "0.5px solid rgba(167,139,250,0.2)", color: "#a78bfa" }}>
                      {fp.projectStage}
                    </span>
                  ) : null}
                  {fp.chainFocus ? (
                    <span className="rounded-full px-2.5 py-1 text-[11px]" style={{ backgroundColor: "#1a1a1e", border: "0.5px solid #27272a", color: "#71717a" }}>
                      {fp.chainFocus}
                    </span>
                  ) : null}
                  {fp.website ? (
                    <a href={fp.website} target="_blank" rel="noreferrer"
                      className="rounded-full px-2.5 py-1 text-[11px] transition-opacity hover:opacity-80"
                      style={{ backgroundColor: "rgba(52,211,153,0.06)", border: "0.5px solid rgba(52,211,153,0.2)", color: "#34d399" }}>
                      ↗ Website
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
            {/* Education / background */}
            {(fp.educationBackground ?? profile.educationBackground) ? (
              <div className="rounded-[14px] p-4" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
                <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "#52525b" }}>Background</p>
                <p className="mt-1.5 text-[13px] leading-[1.6]" style={{ color: "#a1a1aa" }}>
                  {fp.educationBackground ?? profile.educationBackground}
                </p>
              </div>
            ) : null}
          </div>
          {/* Right sidebar */}
          <div className="space-y-3">
            <ConnectRequestCard
              toUserId={profile.id}
              toUsername={profile.username ?? ""}
              source={resolvedSearch.source ?? "public-profile-founder"}
              openToConnections={openToConnections}
              isLoggedIn={Boolean(session?.user?.id)}
              isSelf={session?.user?.id === profile.id}
            />
            {/* Quick links */}
            <div className="rounded-[14px] p-3.5 space-y-1.5" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
              <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "#52525b" }}>Links</p>
              {fp.website ? <a href={fp.website} target="_blank" rel="noreferrer" className="block text-[13px] transition-opacity hover:opacity-80" style={{ color: "#a78bfa" }}>↗ {fp.website.replace(/^https?:\/\//, "")}</a> : null}
              {fp.linkedin ? <a href={fp.linkedin} target="_blank" rel="noreferrer" className="block text-[13px] transition-opacity hover:opacity-80" style={{ color: "#60a5fa" }}>↗ LinkedIn</a> : null}
              {fp.twitter ? <a href={fp.twitter} target="_blank" rel="noreferrer" className="block text-[13px] transition-opacity hover:opacity-80" style={{ color: "#e4e4e7" }}>↗ X / Twitter</a> : null}
              {!fp.website && !fp.linkedin && !fp.twitter ? (
                <p className="text-[12px]" style={{ color: "#3f3f46" }}>No public links added.</p>
              ) : null}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "ventures",
      label: "Ventures",
      content: (
        <div className="space-y-3">
          {profile.ownedVentures.length === 0 ? (
            <ProfileEmptyState
              icon={Globe}
              title="No public ventures yet"
              description="Ventures added by this founder will appear here once made public."
            />
          ) : (
            profile.ownedVentures.map((venture) => (
              <VentureCard
                key={venture.id}
                name={venture.name}
                description={venture.description ?? undefined}
                stage={venture.stage ?? undefined}
                chain={venture.chainEcosystem ?? undefined}
                website={venture.website ?? undefined}
                isHiring={fp.isHiring}
              />
            ))
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
            <ProfileEmptyState
              icon={FileText}
              title="No public posts yet"
              description="Updates shared by this founder will appear here once published."
            />
          ) : (
            recentPosts.map((post) => (
              <PostCard
                key={post.id}
                postType={post.postType}
                title={post.title}
                body={(post as { body?: string | null }).body}
                createdAt={post.createdAt}
              />
            ))
          )}
        </div>
      ),
    },
    {
      key: "jobs",
      label: "Jobs",
      content: (
        <div className="space-y-3">
          {fp.isHiring ? (
            <div className="rounded-[16px] p-5 space-y-2" style={{ backgroundColor: "rgba(251,191,36,0.05)", border: "0.5px solid rgba(251,191,36,0.2)" }}>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" style={{ color: "#fbbf24" }} />
                <p className="text-[13px] font-semibold" style={{ color: "#fbbf24" }}>Actively Hiring</p>
              </div>
              <p className="text-[13px] leading-5" style={{ color: "#a1a1aa" }}>
                This founder is currently looking to hire. Use the contact methods to reach out with your intro.
              </p>
              {(fp.lookingFor ?? []).length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(fp.lookingFor ?? []).map((role) => (
                    <span key={role} className="rounded-full px-2.5 py-1 text-[11px]" style={{ backgroundColor: "rgba(251,191,36,0.08)", border: "0.5px solid rgba(251,191,36,0.25)", color: "#fbbf24" }}>
                      {role}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <ProfileEmptyState
              icon={Briefcase}
              title="Not actively hiring"
              description="This founder is not currently advertising open roles."
            />
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
            <ProfileEmptyState
              icon={Users}
              title="No public contact methods"
              description="This founder has not exposed external contact links publicly. You can still send a connection request."
            />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {contactCards.map((m) => (
                <ContactMethodCard key={`${m.type}-${m.href}`} type={m.type} label={m.label} href={m.href} />
              ))}
            </div>
          )}
          <ConnectRequestCard
            toUserId={profile.id}
            toUsername={profile.username ?? ""}
            source={resolvedSearch.source ?? "public-profile-founder"}
            openToConnections={openToConnections}
            isLoggedIn={Boolean(session?.user?.id)}
            isSelf={session?.user?.id === profile.id}
          />
        </div>
      ),
    },
  ];

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-8">
      <PublicProfileHero
        role="founder"
        name={profile.name ?? "Founder"}
        username={profile.username ?? ""}
        image={profile.image}
        bio={profile.bio}
        headline={fp.companyName ? `Building ${fp.companyName}` : undefined}
        statusChips={statusChips}
        websiteUrl={fp.website}
        linkedProfileHref={linkedBuilder?.username ? `/builder/${linkedBuilder.username}` : undefined}
        linkedProfileLabel={linkedBuilder?.username ? "Builder" : undefined}
        sharePath={`/founder/${profile.username ?? username}`}
      />
      <PublicProfileTabs tabs={tabs} accent="#a78bfa" />
    </main>
  );
}

