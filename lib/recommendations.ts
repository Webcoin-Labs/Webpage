import { prisma } from "@/lib/prisma";
import { scoreBuilderToProject, scoreFounderToBuilder } from "@/lib/matching";

export async function getRecommendedBuildersForFounder(userId: string, take = 6) {
  const [founderProfile, builders] = await Promise.all([
    prisma.founderProfile.findUnique({ where: { userId } }),
    prisma.builderProfile.findMany({
      where: { publicVisible: true },
      include: { user: { select: { id: true, name: true, image: true } } },
      take: 120,
    }),
  ]);

  if (!founderProfile) return [];

  return builders
    .map((builder) => ({
      builder,
      match: scoreFounderToBuilder(founderProfile, builder),
    }))
    .filter((item) => item.match.score > 0)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, take);
}

export async function getRecommendedProjectsForBuilder(userId: string, take = 6) {
  const [builderProfile, projects] = await Promise.all([
    prisma.builderProfile.findUnique({ where: { userId } }),
    prisma.project.findMany({
      where: { publicVisible: true },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            founderProfile: { select: { companyName: true, isHiring: true } },
          },
        },
      },
      take: 150,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!builderProfile) return [];

  return projects
    .map((project) => ({
      project,
      match: scoreBuilderToProject(builderProfile, project),
    }))
    .filter((item) => item.match.score > 0)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, take);
}
