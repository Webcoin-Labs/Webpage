import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Globe, GraduationCap, Linkedin, Mail, MessageCircle, Wallet } from "lucide-react";
import { getFounderPublicProfile } from "@/lib/public-profiles";
import { authOptions } from "@/lib/auth";
import { canViewerAccessInvestorOnlyContacts, normalizeTelegramUrl } from "@/lib/contact-visibility";
import { trackProfileView } from "@/lib/profile-views";
import { db } from "@/server/db/client";
import { mapPublicContactMethods } from "@/lib/contact-methods";
import { PrivateProfileState } from "@/components/profile/PrivateProfileState";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import { sendConnectionRequest } from "@/app/actions/connections";

export default async function FounderPublicPage({
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
    take: 5,
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

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/70 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-3">
            <ProfileAvatar
              src={profile.image}
              alt={profile.name ?? "Founder"}
              fallback={(profile.name ?? profile.username ?? "F").charAt(0)}
              className="h-14 w-14 rounded-xl"
              fallbackClassName="bg-cyan-500/20 text-cyan-200"
            />
            <div>
              <p className="text-xs text-cyan-300">Founder Public Profile</p>
              <h1 className="mt-1 text-2xl font-semibold">{profile.name ?? "Founder"}</h1>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
            <p>{profile.founderProfile.roleTitle ?? "Founder"}</p>
            <p>{profile.founderProfile.isHiring ? "Hiring active" : "Hiring paused"}</p>
          </div>
        </div>
        {profile.bio ? <p className="mt-4 text-sm text-muted-foreground">{profile.bio}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-border px-2 py-1">{profile.founderProfile.companyName ?? "Company not added"}</span>
          <span className="rounded-full border border-border px-2 py-1">{profile.founderProfile.projectStage ?? "Stage not set"}</span>
          <span className="rounded-full border border-border px-2 py-1">{profile.founderProfile.chainFocus ?? "Chain not set"}</span>
          {linkedBuilder?.username ? (
            <Link href={`/builder/${linkedBuilder.username}`} className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-cyan-200">
              Also Builder
            </Link>
          ) : null}
        </div>
        <div className="mt-4 rounded-lg border border-border/60 bg-background/50 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-cyan-300">Connect</p>
          <div className="flex items-center gap-2">
            {showTelegram ? (
              <a
                href={normalizeTelegramUrl(profile.founderProfile.telegram)!}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:text-cyan-200"
                aria-label="Telegram"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            ) : null}
            {showLinkedin ? (
              <a href={profile.founderProfile.linkedin!} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:text-cyan-200" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
            ) : null}
            {showEmail ? (
              <a href={`mailto:${profile.email}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:text-cyan-200" aria-label="Email">
                <Mail className="h-4 w-4" />
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
            : "This founder is currently not open to new connection requests."}
        </section>
      ) : null}
      {session?.user?.id && session.user.id !== profile.id && openToConnections ? (
        <section className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Request connection</p>
          <form action={sendConnectionRequest} className="mt-2 space-y-2">
            <input type="hidden" name="toUserId" value={profile.id} />
            <input type="hidden" name="toUsername" value={profile.username ?? ""} />
            <input type="hidden" name="source" value={resolvedSearch.source ?? "public-profile-founder"} />
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
            <Globe className="h-4 w-4 text-cyan-300" /> Venture Identity
          </div>
          <p className="text-sm text-muted-foreground">{profile.founderProfile.companyDescription ?? "No company description provided yet."}</p>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            {profile.founderProfile.website ? <p>Website: {profile.founderProfile.website}</p> : null}
            {profile.founderProfile.linkedin ? <p>LinkedIn: {profile.founderProfile.linkedin}</p> : null}
            {profile.founderProfile.twitter ? <p>X: {profile.founderProfile.twitter}</p> : null}
          </div>
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <GraduationCap className="h-4 w-4 text-cyan-300" /> Founder Background
          </div>
          <p className="text-sm text-muted-foreground">
            {profile.founderProfile.educationBackground ?? profile.educationBackground ?? "Education background not published yet."}
          </p>
          {profile.founderProfile.lookingFor.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {profile.founderProfile.lookingFor.map((item) => (
                <span key={item} className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-cyan-200">
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="mb-2 text-sm font-semibold">Ventures</p>
        {profile.ownedVentures.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public ventures yet.</p>
        ) : (
          <div className="space-y-2">
            {profile.ownedVentures.map((venture) => (
              <article key={venture.id} className="rounded-md border border-border/60 p-3">
                <p className="text-sm font-medium">{venture.name}</p>
                <p className="text-xs text-muted-foreground">
                  {venture.stage ?? "Stage not set"} | {venture.chainEcosystem ?? "Chain not set"}
                </p>
                {venture.description ? <p className="mt-1 text-xs text-muted-foreground">{venture.description}</p> : null}
                {venture.website ? (
                  <a href={venture.website} className="mt-2 inline-flex text-xs text-cyan-300" target="_blank" rel="noreferrer">
                    Open project website
                  </a>
                ) : null}
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
          <Wallet className="h-4 w-4 text-cyan-300" /> Wallet Verification
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
