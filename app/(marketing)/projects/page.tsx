import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { ProjectsDirectoryClient } from "./ProjectsDirectoryClient";

export const metadata: Metadata = {
  title: "Projects — Webcoin Labs",
  description: "Discover projects in the Webcoin Labs network. Filter by chain and stage.",
};

async function getProjects() {
  return prisma.project.findMany({
    where: { publicVisible: true },
    include: { owner: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="min-h-screen pt-24">
      <section className="py-20 container mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">Directory</p>
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Projects <span className="gradient-text">network</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Discover projects building in the Webcoin Labs ecosystem. Filter by chain focus and stage.
          </p>
        </AnimatedSection>

        <ProjectsDirectoryClient initialProjects={projects} />
      </section>
    </div>
  );
}
