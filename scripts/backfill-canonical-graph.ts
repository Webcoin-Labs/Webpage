import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfillInvestorCanonicalProfileLink() {
  const investors = await prisma.$queryRaw<Array<{ id: string; userId: string; canonicalInvestorProfileId: string | null }>>`
    SELECT "id", "userId", "canonicalInvestorProfileId" FROM "Investor"
  `;
  let updated = 0;
  for (const investor of investors) {
    if (investor.canonicalInvestorProfileId) continue;
    const profile = await prisma.investorProfile.findUnique({
      where: { userId: investor.userId },
      select: { id: true },
    });
    if (!profile) continue;
    await prisma.$executeRaw`
      UPDATE "Investor"
      SET "canonicalInvestorProfileId" = ${profile.id}
      WHERE "id" = ${investor.id}
    `;
    updated += 1;
  }
  return updated;
}

async function backfillStartupVentureLink() {
  const startups = await prisma.$queryRaw<Array<{ id: string; founderId: string; name: string; slug: string | null; website: string | null; canonicalVentureId: string | null }>>`
    SELECT "id", "founderId", "name", "slug", "website", "canonicalVentureId"
    FROM "Startup"
    WHERE "canonicalVentureId" IS NULL
  `;
  let linked = 0;
  for (const startup of startups) {
    const startupOr: Array<{ slug?: string; name?: string; website?: string }> = [];
    if (startup.slug) startupOr.push({ slug: startup.slug });
    startupOr.push({ name: startup.name });
    if (startup.website) startupOr.push({ website: startup.website });
    const candidate =
      (await prisma.venture.findFirst({
        where: {
          ownerUserId: startup.founderId,
          OR: startupOr,
        },
        select: { id: true },
      })) ??
      (await prisma.venture.findFirst({
        where: { ownerUserId: startup.founderId },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      }));

    if (!candidate) continue;
    await prisma.$executeRaw`
      UPDATE "Startup"
      SET "canonicalVentureId" = ${candidate.id}
      WHERE "id" = ${startup.id}
    `;
    linked += 1;
  }
  return linked;
}

async function backfillProjectVentureLink() {
  const projects = await prisma.$queryRaw<Array<{ id: string; ownerUserId: string; name: string; slug: string | null; websiteUrl: string | null; canonicalVentureId: string | null }>>`
    SELECT "id", "ownerUserId", "name", "slug", "websiteUrl", "canonicalVentureId"
    FROM "Project"
    WHERE "canonicalVentureId" IS NULL
  `;
  let linked = 0;
  for (const project of projects) {
    const projectOr: Array<{ slug?: string; name?: string; website?: string }> = [];
    if (project.slug) projectOr.push({ slug: project.slug });
    projectOr.push({ name: project.name });
    if (project.websiteUrl) projectOr.push({ website: project.websiteUrl });
    const candidate =
      (await prisma.venture.findFirst({
        where: {
          ownerUserId: project.ownerUserId,
          OR: projectOr,
        },
        select: { id: true },
      })) ??
      (await prisma.venture.findFirst({
        where: { ownerUserId: project.ownerUserId },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      }));
    if (!candidate) continue;
    await prisma.$executeRaw`
      UPDATE "Project"
      SET "canonicalVentureId" = ${candidate.id}
      WHERE "id" = ${project.id}
    `;
    linked += 1;
  }
  return linked;
}

async function backfillVisibilityRules(adminUserId: string | null) {
  const hiddenFounderProfiles = await prisma.founderProfile.findMany({
    where: { publicVisible: false },
    select: { id: true, userId: true },
  });
  let inserted = 0;
  for (const profile of hiddenFounderProfiles) {
    const entityId = profile.id;
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "VisibilityRule"
      WHERE "entityType" = 'FOUNDER_PROFILE'::"VisibilityEntityType"
      AND "entityId" = ${entityId}
      AND "isActive" = true
      LIMIT 1
    `;
    if (existing.length > 0) continue;
    await prisma.$executeRaw`
      INSERT INTO "VisibilityRule"
        ("id","entityType","entityId","accessLevel","createdByAdminId","reason","isActive","createdAt","updatedAt")
      VALUES
        (${crypto.randomUUID().replace(/-/g, "")}, 'FOUNDER_PROFILE'::"VisibilityEntityType", ${entityId}, 'PRIVATE'::"VisibilityAccessLevel", ${adminUserId}, 'Backfilled from founderProfile.publicVisible=false', true, NOW(), NOW())
    `;
    inserted += 1;
  }
  return inserted;
}

async function backfillScoreSnapshots(adminUserId: string | null) {
  const apps = await prisma.investorApplication.findMany({
    where: {
      OR: [{ readinessScore: { not: null } }, { investorFitScore: { not: null } }],
    },
    select: {
      id: true,
      founderUserId: true,
      investorUserId: true,
      ventureId: true,
      readinessScore: true,
      investorFitScore: true,
      createdAt: true,
    },
    take: 5000,
  });

  let inserted = 0;
  for (const app of apps) {
    if (app.readinessScore !== null) {
      await prisma.$executeRaw`
        INSERT INTO "ScoreSnapshot"
          ("id","kind","status","label","score","sourceVersion","factorsJson","scoredUserId","ventureId","overriddenByAdminId","computedAt","createdAt","updatedAt")
        VALUES
          (${crypto.randomUUID().replace(/-/g, "")}, 'FOUNDER_LAUNCH_READINESS'::"ScoreKind", 'ACTIVE'::"ScoreStatus", ${app.readinessScore >= 75 ? "strong" : app.readinessScore >= 45 ? "moderate" : "missing"}, ${app.readinessScore}, 'legacy-investor-application-v1', ${JSON.stringify({ source: "InvestorApplication.readinessScore", applicationId: app.id })}::jsonb, ${app.founderUserId}, ${app.ventureId}, ${adminUserId}, ${app.createdAt}, NOW(), NOW())
      `;
      inserted += 1;
    }
    if (app.investorFitScore !== null) {
      await prisma.$executeRaw`
        INSERT INTO "ScoreSnapshot"
          ("id","kind","status","label","score","sourceVersion","factorsJson","scoredUserId","ventureId","overriddenByAdminId","computedAt","createdAt","updatedAt")
        VALUES
          (${crypto.randomUUID().replace(/-/g, "")}, 'INVESTOR_FIT_HELPER'::"ScoreKind", 'ACTIVE'::"ScoreStatus", ${app.investorFitScore >= 75 ? "strong" : app.investorFitScore >= 45 ? "moderate" : "missing"}, ${app.investorFitScore}, 'legacy-investor-application-v1', ${JSON.stringify({ source: "InvestorApplication.investorFitScore", applicationId: app.id })}::jsonb, ${app.investorUserId}, ${app.ventureId}, ${adminUserId}, ${app.createdAt}, NOW(), NOW())
      `;
      inserted += 1;
    }
  }

  return inserted;
}

async function backfillDiligenceMemos() {
  const ratings = await prisma.$queryRaw<Array<{
    id: string;
    reviewerId: string;
    score: number;
    note: string;
    createdAt: Date;
    canonicalVentureId: string | null;
    startupName: string;
  }>>`
    SELECT
      sr."id",
      sr."reviewerId",
      sr."score",
      sr."note",
      sr."createdAt",
      s."canonicalVentureId",
      s."name" as "startupName"
    FROM "StartupRating" sr
    JOIN "Startup" s ON s."id" = sr."startupId"
    WHERE sr."note" IS NOT NULL
    ORDER BY sr."createdAt" DESC
    LIMIT 5000
  `;

  let inserted = 0;
  for (const rating of ratings) {
    if (!rating.canonicalVentureId) continue;
    await prisma.$executeRaw`
      INSERT INTO "DiligenceMemo"
        ("id","ventureId","authorUserId","title","status","summary","sectionsJson","riskFlagsJson","version","isInternal","createdAt","updatedAt")
      VALUES
        (${crypto.randomUUID().replace(/-/g, "")}, ${rating.canonicalVentureId}, ${rating.reviewerId}, ${`Legacy diligence note - ${rating.startupName}`}, 'FINAL'::"DiligenceStatus", ${rating.note}, ${JSON.stringify({ legacySource: "StartupRating", startupRatingId: rating.id, numericScore: rating.score })}::jsonb, ${JSON.stringify([])}::jsonb, 1, true, ${rating.createdAt}, NOW())
    `;
    inserted += 1;
  }
  return inserted;
}

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  const adminUserId = admin?.id ?? null;

  const [investorLinks, startupLinks, projectLinks, visibilityRules, scoreSnapshots, diligenceMemos] = await Promise.all([
    backfillInvestorCanonicalProfileLink(),
    backfillStartupVentureLink(),
    backfillProjectVentureLink(),
    backfillVisibilityRules(adminUserId),
    backfillScoreSnapshots(adminUserId),
    backfillDiligenceMemos(),
  ]);

  console.log("Canonical backfill completed.");
  console.log(
    JSON.stringify(
      {
        investorLinks,
        startupLinks,
        projectLinks,
        visibilityRules,
        scoreSnapshots,
        diligenceMemos,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
