import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { BuildersDirectoryClient } from "./BuildersDirectoryClient";

export const metadata: Metadata = {
  title: "Builders — Webcoin Labs",
  description: "Discover builders in the Webcoin Labs network. Skills, chain focus, and profiles.",
};

async function getBuilders() {
  return prisma.builderProfile.findMany({
    where: { publicVisible: true },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export default async function BuildersPage() {
  const builders = await getBuilders();

  return (
    <div className="min-h-screen pt-24">
      <section className="py-20 container mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-4">Directory</p>
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Builders <span className="gradient-text">network</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Discover builders in the Webcoin Labs network. Filter by skills and chain focus.
          </p>
        </AnimatedSection>

        <BuildersDirectoryClient initialBuilders={builders} />
      </section>
    </div>
  );
}
