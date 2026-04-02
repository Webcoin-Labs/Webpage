import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db/client";
import { NewIntroRequestForm } from "@/components/app/NewIntroRequestForm";

function getFirstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function NewIntroPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "FOUNDER" && session.user.role !== "ADMIN") redirect("/app/intros");

  const requestedType = getFirstParam(resolvedSearchParams?.type);
  const requestedTier = getFirstParam(resolvedSearchParams?.tier);
  const defaultType = requestedType === "VC" ? "VC" : "KOL";
  const defaultPriorityTier = requestedTier === "PREMIUM" ? "PREMIUM" : "STANDARD";

  const [projects, builders, partners] = await Promise.all([
    db.project.findMany({
      where: session.user.role === "ADMIN" ? {} : { ownerUserId: session.user.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.builderProfile.findMany({
      where: { publicVisible: true },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    db.partner.findMany({
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

