import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewIntroRequestForm } from "@/components/app/NewIntroRequestForm";

function getFirstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function NewIntroPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "FOUNDER" && session.user.role !== "ADMIN") redirect("/app/intros");

  const requestedType = getFirstParam(searchParams?.type);
  const requestedTier = getFirstParam(searchParams?.tier);
  const defaultType = requestedType === "VC" ? "VC" : "KOL";
  const defaultPriorityTier = requestedTier === "PREMIUM" ? "PREMIUM" : "STANDARD";

  const [projects, builders, partners] = await Promise.all([
    prisma.project.findMany({
      where: session.user.role === "ADMIN" ? {} : { ownerUserId: session.user.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.builderProfile.findMany({
      where: { publicVisible: true },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.partner.findMany({
      where: { status: "CURRENT" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 80,
    }),
  ]);

  return (
    <NewIntroRequestForm
      projects={projects.map((project) => ({ id: project.id, label: project.name }))}
      builders={builders.map((builder) => {
        const tag = builder.affiliation?.trim()
          ? builder.affiliation.trim()
          : builder.independent
            ? "Independent"
            : builder.openToWork
              ? "Available"
              : "";
        return {
          id: builder.user.id,
          label: tag ? `${builder.user.name ?? "Builder"} | ${tag}` : (builder.user.name ?? "Builder"),
        };
      })}
      partners={partners.map((partner) => ({ id: partner.id, label: partner.name }))}
      defaultType={defaultType}
      defaultPriorityTier={defaultPriorityTier}
    />
  );
}
