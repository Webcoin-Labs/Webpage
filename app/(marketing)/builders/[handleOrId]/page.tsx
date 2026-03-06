import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { MapPin, Github, Twitter, Globe, BadgeCheck } from "lucide-react";

type Params = { params: Promise<{ handleOrId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handleOrId } = await params;
  const profile = await prisma.builderProfile.findFirst({
    where: { publicVisible: true, OR: [{ handle: handleOrId }, { user: { id: handleOrId } }] },
    include: { user: { select: { name: true } } },
  });
  if (!profile) return { title: "Builder — Webcoin Labs" };
  return {
    title: `${profile.user.name ?? "Builder"} — Webcoin Labs`,
    description: profile.headline ?? profile.bio ?? "Builder profile on Webcoin Labs",
  };
}

async function getBuilder(handleOrId: string) {
  return prisma.builderProfile.findFirst({
    where: { publicVisible: true, OR: [{ handle: handleOrId }, { user: { id: handleOrId } }] },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
}

export default async function BuilderProfilePage({ params }: Params) {
  const { handleOrId } = await params;
  const profile = await getBuilder(handleOrId);
  if (!profile) notFound();

  return (
    <div className="min-h-screen pt-24">
      <section className="py-12 container mx-auto px-6 max-w-3xl">
        <AnimatedSection>
          <Link href="/builders" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">← Back to Builders</Link>
        </AnimatedSection>
        <AnimatedSection delay={0.1} className="p-8 rounded-2xl border border-border/50 bg-card">
          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            {profile.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.user.image} alt="" className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center text-2xl font-bold text-cyan-400 flex-shrink-0">
                {profile.user.name?.charAt(0) ?? "?"}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{profile.user.name ?? "Builder"}</h1>
                {profile.verifiedByWebcoinLabs && (
                  <span className="text-cyan-400" title="Verified by Webcoin Labs"><BadgeCheck className="w-5 h-5" /></span>
                )}
              </div>
              {profile.headline && <p className="text-muted-foreground mt-1">{profile.headline}</p>}
              {profile.location && (
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {profile.location}
                </p>
              )}
            </div>
          </div>
          {profile.bio && <p className="text-sm leading-relaxed text-muted-foreground mb-6">{profile.bio}</p>}
          {profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {profile.skills.map((s) => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{s}</span>
              ))}
            </div>
          )}
          {(profile.github || profile.twitter || profile.website) && (
            <div className="flex flex-wrap gap-4 text-sm">
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                  <Github className="w-4 h-4" /> GitHub
                </a>
              )}
              {profile.twitter && (
                <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                  <Twitter className="w-4 h-4" /> Twitter
                </a>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                  <Globe className="w-4 h-4" /> Website
                </a>
              )}
            </div>
          )}
        </AnimatedSection>
      </section>
    </div>
  );
}
