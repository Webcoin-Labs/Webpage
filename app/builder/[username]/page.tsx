import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { Code2, FileText, Github, LayoutGrid, Users } from "lucide-react";
import { getBuilderPublicProfile } from "@/lib/public-profiles";
import {
  canViewerAccessInvestorOnlyContacts,
  normalizeTelegramUrl,
  readTelegramFromSocialLinks,
} from "@/lib/contact-visibility";
import { trackProfileView } from "@/lib/profile-views";
import { db } from "@/server/db/client";
import { mapPublicContactMethods } from "@/lib/contact-methods";
import { PrivateProfileState } from "@/components/profile/PrivateProfileState";
import { sendConnectionRequest } from "@/app/actions/connections";
import { PublicProfileHero } from "@/components/public-profile/PublicProfileHero";
import { PublicProfileTabs } from "@/components/public-profile/PublicProfileTabs";
import { ContactMethodCard } from "@/components/public-profile/ContactMethodCard";
import { ConnectRequestCard } from "@/components/public-profile/ConnectRequestCard";
import { ProjectCard } from "@/components/public-profile/ProjectCard";
import { PostCard } from "@/components/public-profile/PostCard";
import { ProfileEmptyState } from "@/components/public-profile/ProfileEmptyState";

// sendConnectionRequest is used by ConnectRequestCard client component via import
void sendConnectionRequest;

export default async function BuilderPublicPage({
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
  const profile = await getBuilderPublicProfile(username, {
    userId: session?.user?.id,
    role: session?.user?.role,
  });
  if (!profile || !profile.builderProfile) {
    const privateCandidate = await db.user.findFirst({
      where: { username: username.toLowerCase(), builderProfile: { isNot: null } },
      select: { username: true, publicProfileSettings: { select: { openToConnections: true } } },
    });
    if (privateCandidate?.username) {
      return (
        <PrivateProfileState
          username={privateCandidate.username}
          roleLabel="Builder"
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
    source: "public_profile_builder",
    roleContext: session?.user?.role ?? null,
  });
  const recentPosts = await db.feedPost.findMany({
    where: { authorUserId: profile.id, visibility: "PUBLIC" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const openToConnections = profile.publicProfileSettings?.openToConnections ?? true;
  const publicContactMethods = openToConnections ? mapPublicContactMethods(profile.profileContactMethods ?? []) : [];
  const linkedFounder =
    profile.founderProfile
      ? { username: profile.username, name: profile.name }
      : profile.profileLinksFrom.find((link) => link.toUser.founderProfile)?.toUser;
  const linkedFounderFromProfileLink = profile.profileLinksFrom.find((link) => link.toUser.founderProfile)?.toUser;
  const founderTelegramValue =
    linkedFounderFromProfileLink?.founderProfile?.telegram ??
    readTelegramFromSocialLinks(profile.socialLinks);
  const founderAllowsTelegramToInvestors =
    linkedFounderFromProfileLink?.publicProfileSettings?.showTelegramToInvestors ?? true;
  const showTelegram =
    viewerIsInvestor && founderAllowsTelegramToInvestors && Boolean(founderTelegramValue);
  const showLinkedin =
    viewerIsInvestor &&
    (profile.publicProfileSettings?.showLinkedinToInvestors ?? true) &&
    Boolean(profile.builderProfile.linkedin);
  const showEmail =
    viewerIsInvestor &&
    (profile.publicProfileSettings?.showEmailToInvestors ?? false) &&
    Boolean(profile.email);

  const bp = profile.builderProfile;

  const contactCards: { type: string; label: string; href: string }[] = [
    ...(showTelegram && founderTelegramValue
      ? [{ type: "TELEGRAM", label: "Telegram", href: normalizeTelegramUrl(founderTelegramValue) ?? "#" }]
      : []),
    ...(showLinkedin && bp.linkedin
      ? [{ type: "LINKEDIN", label: "LinkedIn", href: bp.linkedin }]
      : []),
    ...(showEmail && profile.email
      ? [{ type: "EMAIL", label: "Email", href: `mailto:${profile.email}` }]
      : []),
    ...(bp.github ? [{ type: "GITHUB", label: "GitHub", href: bp.github }] : []),
    ...publicContactMethods.map((m) => ({ type: m.type ?? "WEBSITE", label: m.label, href: m.href })),
  ];

  const statusChips: { label: string; color?: "amber" | "green" | "violet" | "cyan" | "default" }[] = [
    ...(bp.openToWork ? [{ label: "Open to work", color: "green" as const }] : []),
    ...((bp.openTo ?? []).slice(0, 3).map((ot) => ({ label: ot, color: "cyan" as const }))),
  ];

  const tabs = [
    {
      key: "overview",
      label: "Overview",
      content: (
        <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
          <div className="space-y-3">
            {/* About */}
            {(bp.headline ?? bp.bio ?? profile.bio) ? (
              <div className="rounded-[14px] p-4" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
                <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "#52525b" }}>About</p>
                <p className="mt-1.5 text-[13px] leading-[1.6]" style={{ color: "#a1a1aa" }}>
                  {bp.headline ?? bp.bio ?? profile.bio}
                </p>
              </div>
            ) : null}
            {/* Stack and skills */}
            {(bp.skills?.length || bp.stack?.length) ? (
              <div className="rounded-[14px] p-4" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
                <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "#52525b" }}>Skills & Stack</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(bp.skills ?? []).slice(0, 12).map((s) => (
                    <span key={s} className="rounded-full px-2.5 py-1 text-[11px]"
                      style={{ backgroundColor: "rgba(34,211,238,0.06)", border: "0.5px solid rgba(34,211,238,0.15)", color: "#22d3ee" }}>
                      {s}
                    </span>
                  ))}
                  {(bp.stack ?? []).slice(0, 8).map((s) => (
                    <span key={s} className="rounded-full px-2.5 py-1 text-[11px]"
                      style={{ backgroundColor: "#1a1a1e", border: "0.5px solid #27272a", color: "#71717a" }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {/* Chains */}
            {(bp.chainExpertise?.length ?? 0) > 0 || (bp.preferredChains?.length ?? 0) > 0 ? (
              <div className="rounded-[14px] p-4" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
                <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "#52525b" }}>Chain Expertise</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[...(bp.chainExpertise ?? []), ...(bp.preferredChains ?? [])].slice(0, 10).map((c) => (
                    <span key={c} className="rounded-full px-2.5 py-1 text-[11px]"
                      style={{ backgroundColor: "rgba(167,139,250,0.06)", border: "0.5px solid rgba(167,139,250,0.15)", color: "#a78bfa" }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          {/* Sidebar */}
          <div className="space-y-3">
            <ConnectRequestCard
              toUserId={profile.id}
              toUsername={profile.username ?? ""}
              source={resolvedSearch.source ?? "public-profile-builder"}
              openToConnections={openToConnections}
              isLoggedIn={Boolean(session?.user?.id)}
              isSelf={session?.user?.id === profile.id}
            />
            {/* GitHub */}
            <div className="rounded-[16px] p-4 space-y-2" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
              <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#52525b" }}>GitHub</p>
              {profile.githubConnection?.username ? (
                <p className="text-[13px]" style={{ color: "#a1a1aa" }}>
                  @{profile.githubConnection.username}
                </p>
              ) : null}
              {bp.github ? (
                <a href={bp.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] transition-opacity hover:opacity-80" style={{ color: "#22d3ee" }}>
                  <Github className="h-3.5 w-3.5" />
                  Open GitHub profile
                </a>
              ) : (
                <p className="text-[12px]" style={{ color: "#3f3f46" }}>No GitHub linked.</p>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "projects",
      label: "Projects",
      content: (
        <div className="space-y-3">
          {profile.builderProjects.length === 0 ? (
            <ProfileEmptyState
              icon={LayoutGrid}
              title="No public projects yet"
              description="Projects added by this builder will appear here once published."
            />
          ) : (
            profile.builderProjects.map((project) => (
              <ProjectCard
                key={project.id}
                title={project.title}
                tagline={project.tagline}
                techStack={project.techStack}
                githubUrl={project.githubUrl}
                liveUrl={(project as { liveUrl?: string | null }).liveUrl}
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
              description="Updates shared by this builder will appear here once published."
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
      key: "availability",
      label: "Availability",
      content: (
        <div className="space-y-3">
          <div className="rounded-[16px] p-5" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
            <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#52525b" }}>Status</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: bp.openToWork ? "#34d399" : "#52525b" }}
              />
              <p className="text-[14px] font-medium" style={{ color: "#d4d4d8" }}>
                {bp.openToWork ? "Open to work" : "Not currently available"}
              </p>
            </div>
            {bp.availability ? (
              <p className="mt-2 text-[13px]" style={{ color: "#71717a" }}>{bp.availability}</p>
            ) : null}
          </div>
          {(bp.lookingForRoles?.length ?? 0) > 0 || (bp.openTo?.length ?? 0) > 0 ? (
            <div className="rounded-[16px] p-5" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
              <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#52525b" }}>Open to</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[...(bp.lookingForRoles ?? []), ...(bp.openTo ?? [])].map((r) => (
                  <span key={r} className="rounded-full px-2.5 py-1 text-[11px]"
                    style={{ backgroundColor: "rgba(34,211,238,0.06)", border: "0.5px solid rgba(34,211,238,0.15)", color: "#22d3ee" }}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {bp.openSourceContributions ? (
            <div className="rounded-[16px] p-5" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
              <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#52525b" }}>Open Source</p>
              <p className="mt-2 text-[13px] leading-5" style={{ color: "#a1a1aa" }}>{bp.openSourceContributions}</p>
            </div>
          ) : null}
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
              description="This builder has not exposed external contact links publicly. You can still send a connection request."
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
            source={resolvedSearch.source ?? "public-profile-builder"}
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
        role="builder"
        name={profile.name ?? "Builder"}
        username={profile.username ?? ""}
        image={profile.image}
        bio={bp.headline ?? bp.bio ?? profile.bio}
        statusChips={statusChips}
        linkedProfileHref={linkedFounder?.username ? `/founder/${linkedFounder.username}` : undefined}
        linkedProfileLabel={linkedFounder?.username ? "Founder" : undefined}
        sharePath={`/builder/${profile.username ?? username}`}
      />
      <PublicProfileTabs tabs={tabs} accent="#22d3ee" />
    </main>
  );
}
