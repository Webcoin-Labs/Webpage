import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { ExternalLink, Github, Twitter, BadgeCheck } from "lucide-react";

type Params = { params: Promise<{ slugOrId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slugOrId } = await params;
  const project = await prisma.project.findFirst({
    where: { publicVisible: true, OR: [{ slug: slugOrId }, { id: slugOrId }] },
    select: { name: true, tagline: true },
  });
  if (!project) return { title: "Project — Webcoin Labs" };
  return {
    title: `${project.name} — Webcoin Labs`,
    description: project.tagline ?? project.name,
  };
}

async function getProject(slugOrId: string) {
  return prisma.project.findFirst({
    where: { publicVisible: true, OR: [{ slug: slugOrId }, { id: slugOrId }] },
    include: { owner: { select: { id: true, name: true } } },
  });
}

export default async function ProjectPage({ params }: Params) {
  const { slugOrId } = await params;
  const project = await getProject(slugOrId);
  if (!project) notFound();

  const stageLabel = project.stage === "IDEA" ? "Idea" : project.stage === "MVP" ? "MVP" : "Live";

  return (
    <div className="min-h-screen pt-24">
      <section className="py-12 container mx-auto px-6 max-w-3xl">
        <AnimatedSection>
          <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">← Back to Projects</Link>
        </AnimatedSection>
        <AnimatedSection delay={0.1} className="p-8 rounded-2xl border border-border/50 bg-card">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                {project.verifiedByWebcoinLabs && (
                  <span className="text-cyan-400" title="Verified by Webcoin Labs"><BadgeCheck className="w-5 h-5" /></span>
                )}
              </div>
              {project.tagline && <p className="text-muted-foreground mt-1">{project.tagline}</p>}
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full border ${
              project.stage === "LIVE" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
              project.stage === "MVP" ? "bg-violet-500/10 text-violet-400 border-violet-500/20" :
              "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
              {stageLabel}
            </span>
          </div>
          {project.chainFocus && (
            <p className="text-sm text-muted-foreground mb-4">Chain: {project.chainFocus}</p>
          )}
          {project.description && (
            <p className="text-sm leading-relaxed text-muted-foreground mb-6 whitespace-pre-wrap">{project.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm">
            {project.websiteUrl && (
              <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <ExternalLink className="w-4 h-4" /> Website
              </a>
            )}
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <Github className="w-4 h-4" /> GitHub
              </a>
            )}
            {project.twitterUrl && (
              <a href={project.twitterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <Twitter className="w-4 h-4" /> Twitter
              </a>
            )}
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
