import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Globe, GraduationCap, Linkedin, Mail, MessageCircle, Wallet } from "lucide-react";
import { getFounderPublicProfile } from "@/lib/public-profiles";
import { authOptions } from "@/lib/auth";
import { canViewerAccessInvestorOnlyContacts, normalizeTelegramUrl } from "@/lib/contact-visibility";

export default async function FounderPublicPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const session = await getServerSession(authOptions);
  const viewerIsInvestor = canViewerAccessInvestorOnlyContacts(session?.user?.role);
  const profile = await getFounderPublicProfile(username, {
    userId: session?.user?.id,
    role: session?.user?.role,
  });
  if (!profile || !profile.founderProfile) notFound();
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
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <p className="text-xs text-cyan-300">Founder Public Profile</p>
        <h1 className="mt-1 text-2xl font-semibold">{profile.name ?? "Founder"}</h1>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
        {profile.bio ? <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p> : null}
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
        <div className="mt-3 flex items-center gap-2">
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
      </section>

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
