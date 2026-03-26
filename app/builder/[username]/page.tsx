import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Code2, Github, Linkedin, Mail, MessageCircle, Wallet } from "lucide-react";
import { getBuilderPublicProfile } from "@/lib/public-profiles";
import { authOptions } from "@/lib/auth";
import { canViewerAccessInvestorOnlyContacts, normalizeTelegramUrl, readTelegramFromSocialLinks } from "@/lib/contact-visibility";
import { trackProfileView } from "@/lib/profile-views";
import { db } from "@/server/db/client";
import { mapPublicContactMethods } from "@/lib/contact-methods";
import { PrivateProfileState } from "@/components/profile/PrivateProfileState";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import { sendConnectionRequest } from "@/app/actions/connections";

export default async function BuilderPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{ connect?: string; source?: string; viewerRole?: string }>;
}) {
  const { username } = await params;
  const resolvedSearch = (await searchParams) ?? {};
  const session = await getServerSession(authOptions);
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
    take: 5,
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
  const founderAllowsTelegramToInvestors = linkedFounderFromProfileLink?.publicProfileSettings?.showTelegramToInvestors ?? true;
  const showTelegram =
    viewerIsInvestor && founderAllowsTelegramToInvestors && Boolean(founderTelegramValue);
  const showLinkedin =
    viewerIsInvestor && (profile.publicProfileSettings?.showLinkedinToInvestors ?? true) && Boolean(profile.builderProfile.linkedin);
  const showEmail =
    viewerIsInvestor && (profile.publicProfileSettings?.showEmailToInvestors ?? false) && Boolean(profile.email);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/70 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-3">
            <ProfileAvatar
              src={profile.image}
              alt={profile.name ?? "Builder"}
              fallback={(profile.name ?? profile.username ?? "B").charAt(0)}
              className="h-14 w-14 rounded-xl"
              fallbackClassName="bg-cyan-500/20 text-cyan-200"
            />
            <div>
              <p className="text-xs text-cyan-300">Builder Public Profile</p>
              <h1 className="mt-1 text-2xl font-semibold">{profile.name ?? "Builder"}</h1>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
            <p>{profile.builderProfile.title ?? "Builder"}</p>
            <p>{profile.builderProfile.openToWork ? "Open to work" : "Selective availability"}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{profile.builderProfile.headline ?? profile.builderProfile.bio ?? "No headline provided."}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {(profile.builderProfile.skills ?? []).slice(0, 10).map((skill) => (
            <span key={skill} className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-cyan-200">
              {skill}
            </span>
          ))}
          {linkedFounder?.username ? (
            <Link href={`/founder/${linkedFounder.username}`} className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-cyan-200">
              Also Founder
            </Link>
          ) : null}
        </div>
        <div className="mt-4 rounded-lg border border-border/60 bg-background/50 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-cyan-300">Connect</p>
          <div className="flex items-center gap-2">
            {showLinkedin ? (
              <a href={profile.builderProfile.linkedin!} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:text-cyan-200" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
            ) : null}
            {showEmail ? (
              <a href={`mailto:${profile.email}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:text-cyan-200" aria-label="Email">
                <Mail className="h-4 w-4" />
              </a>
            ) : null}
            {showTelegram ? (
              <a
                href={normalizeTelegramUrl(founderTelegramValue)!}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:text-cyan-200"
                aria-label="Telegram"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {publicContactMethods.length === 0 ? (
              <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">No additional public methods</span>
            ) : null}
            {publicContactMethods.map((method) => (
              <a key={`${method.type}-${method.href}`} href={method.href} target="_blank" rel="noreferrer" className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                {method.label}
              </a>
            ))}
          </div>
        </div>
      </section>
      {resolvedSearch.connect === "1" ? (
        <section className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-xs text-cyan-100">
          {openToConnections
            ? `Connection context: ${resolvedSearch.viewerRole ?? "Member"} from ${resolvedSearch.source ?? "profile"}. Use enabled contact methods above.`
            : "This builder is currently not open to new connection requests."}
        </section>
      ) : null}
      {session?.user?.id && session.user.id !== profile.id && openToConnections ? (
        <section className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Request connection</p>
          <form action={sendConnectionRequest} className="mt-2 space-y-2">
            <input type="hidden" name="toUserId" value={profile.id} />
            <input type="hidden" name="toUsername" value={profile.username ?? ""} />
            <input type="hidden" name="source" value={resolvedSearch.source ?? "public-profile-builder"} />
            <textarea name="message" rows={2} placeholder="Short intro message (optional)" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200">
              Send connection request
            </button>
          </form>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Code2 className="h-4 w-4 text-cyan-300" />
            Builder Stack & Intent
          </div>
          <p className="text-xs text-muted-foreground">Stack: {profile.builderProfile.stack.join(", ") || "Not specified"}</p>
          <p className="text-xs text-muted-foreground">Chains: {profile.builderProfile.chainExpertise.join(", ") || profile.builderProfile.preferredChains.join(", ") || "Not specified"}</p>
          <p className="text-xs text-muted-foreground">Looking for: {profile.builderProfile.lookingForRoles.join(", ") || profile.builderProfile.openTo.join(", ") || "Not specified"}</p>
          <p className="text-xs text-muted-foreground">Availability: {profile.builderProfile.availability ?? "Not specified"}</p>
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Github className="h-4 w-4 text-cyan-300" />
            GitHub Proof
          </div>
          <p className="text-xs text-muted-foreground">
            Account: {profile.githubConnection?.username ? `@${profile.githubConnection.username}` : "Not connected"}
          </p>
          {profile.builderProfile.github ? (
            <a href={profile.builderProfile.github} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs text-cyan-300">
              Open GitHub profile
            </a>
          ) : null}
          {profile.builderProfile.openSourceContributions ? (
            <p className="mt-2 text-xs text-muted-foreground">{profile.builderProfile.openSourceContributions}</p>
          ) : null}
        </article>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="mb-2 text-sm font-semibold">Projects</p>
        {profile.builderProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public projects yet.</p>
        ) : (
          <div className="space-y-2">
            {profile.builderProjects.map((project) => (
              <article key={project.id} className="rounded-md border border-border/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{project.title}</p>
                  {project.githubUrl ? (
                    <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-xs text-cyan-300">
                      GitHub
                    </a>
                  ) : null}
                </div>
                {project.tagline ? <p className="mt-1 text-xs text-muted-foreground">{project.tagline}</p> : null}
                <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                  {project.techStack.slice(0, 8).map((item) => (
                    <span key={item} className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="mb-2 text-sm font-semibold">Recent updates</p>
        {recentPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public updates yet.</p>
        ) : (
          <div className="space-y-2">
            {recentPosts.map((post) => (
              <p key={post.id} className="rounded-md border border-border/60 px-3 py-2 text-xs text-muted-foreground">
                {post.postType} | {post.title}
              </p>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Wallet className="h-4 w-4 text-cyan-300" /> Wallet Identity
        </div>
        {profile.walletConnections.length === 0 ? (
          <p className="text-sm text-muted-foreground">No wallet linked publicly.</p>
        ) : (
          <div className="space-y-1 text-xs text-muted-foreground">
            {profile.walletConnections.map((wallet) => (
              <p key={wallet.id}>
                {wallet.network}: {wallet.address}
              </p>
            ))}
          </div>
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
