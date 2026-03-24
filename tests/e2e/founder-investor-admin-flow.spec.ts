import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const nonce = `${Date.now()}`;
const password = "WebcoinFlowPass1";
const founderEmail = `e2e-flow-founder-${nonce}@webcoinlabs.test`;
const investorEmail = `e2e-flow-investor-${nonce}@webcoinlabs.test`;
const adminEmail = `e2e-flow-admin-${nonce}@webcoinlabs.test`;

let founderId = "";
let investorId = "";
let adminId = "";
let ventureId = "";
let applicationId = "";

async function signIn(page: Page, login: string, pass: string) {
  await page.goto("/login");
  await page.getByLabel("Email or username").fill(login);
  await page.locator('input[name="password"]').fill(pass);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app/);
}

test.beforeAll(async () => {
  const passwordHash = await hash(password, 12);

  const founder = await prisma.user.create({
    data: {
      email: founderEmail,
      username: `e2e_flow_founder_${nonce}`,
      name: "E2E Flow Founder",
      role: "FOUNDER",
      onboardingComplete: true,
      password: passwordHash,
    },
  });
  founderId = founder.id;

  const investor = await prisma.user.create({
    data: {
      email: investorEmail,
      username: `e2e_flow_investor_${nonce}`,
      name: "E2E Flow Investor",
      role: "INVESTOR",
      onboardingComplete: true,
      password: passwordHash,
    },
  });
  investorId = investor.id;

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      username: `e2e_flow_admin_${nonce}`,
      name: "E2E Flow Admin",
      role: "ADMIN",
      onboardingComplete: true,
      password: passwordHash,
    },
  });
  adminId = admin.id;

  await prisma.investorProfile.create({
    data: {
      userId: investorId,
      isPublic: true,
      roleTitle: "Partner",
      investmentThesis: "Early-stage Web3 infra",
      chainFocus: ["base"],
      stageFocus: ["seed"],
      sectorFocus: ["infra"],
    },
  });

  const venture = await prisma.venture.create({
    data: {
      ownerUserId: founderId,
      name: `E2E Flow Venture ${nonce}`,
      slug: `e2e-flow-venture-${nonce}`,
      stage: "MVP",
      chainEcosystem: "BASE",
      isPublic: true,
    },
  });
  ventureId = venture.id;
});

test.afterAll(async () => {
  await prisma.user.deleteMany({
    where: {
      id: { in: [founderId, investorId, adminId].filter(Boolean) },
    },
  });
  await prisma.$disconnect();
});

test("founder submits, investor reviews, admin routes assignment", async ({ page }) => {
  const ventureName = `E2E Flow Venture ${nonce}`;
  const assignmentNote = `Route founder to investor ${nonce}`;

  // Founder sends investor application
  await signIn(page, founderEmail, password);
  await page.goto("/app/founder-os/investor-applications");
  await page.locator('select[name="ventureId"]').selectOption(ventureId);
  await page.locator('select[name="investorUserId"]').selectOption(investorId);
  await page.locator('textarea[name="note"]').fill("Please review this venture");
  await page.getByRole("button", { name: /Send investor application/i }).click();
  await page.waitForLoadState("networkidle");

  await expect
    .poll(async () => {
      const created = await prisma.investorApplication.findFirst({
        where: { founderUserId: founderId, investorUserId: investorId, ventureId },
        orderBy: { createdAt: "desc" },
      });
      return created?.id ?? null;
    })
    .not.toBeNull();

  const investorApplication = await prisma.investorApplication.findFirst({
    where: { founderUserId: founderId, investorUserId: investorId, ventureId },
    orderBy: { createdAt: "desc" },
  });
  applicationId = investorApplication!.id;

  await page.context().clearCookies();

  // Investor updates status in inbox
  await signIn(page, investorEmail, password);
  await page.goto("/app/investor-os");
  const appRow = page.locator("article").filter({ hasText: ventureName }).first();
  await expect(appRow).toBeVisible();
  await appRow.locator('select[name="status"]').first().selectOption("REVIEWING");
  await appRow.getByRole("button", { name: "Save" }).first().click();
  await expect
    .poll(async () => {
      const updated = await prisma.investorApplication.findUnique({
        where: { id: applicationId },
        select: { status: true },
      });
      return updated?.status ?? null;
    })
    .toBe("REVIEWING");

  await page.context().clearCookies();

  // Admin creates assignment
  await signIn(page, adminEmail, password);
  await page.goto("/app/admin");
  await page.locator('select[name="type"]').selectOption("FOUNDER_TO_INVESTOR");
  await page.locator('input[name="founderUserId"]').fill(founderId);
  await page.locator('input[name="investorUserId"]').fill(investorId);
  await page.locator('input[name="ventureId"]').fill(ventureId);
  await page.locator('textarea[name="note"]').fill(assignmentNote);
  await page.getByRole("button", { name: "Create assignment" }).click();
  await expect
    .poll(async () => {
      const created = await prisma.adminAssignment.findFirst({
        where: {
          createdByAdminId: adminId,
          founderUserId: founderId,
          investorUserId: investorId,
          ventureId,
          note: assignmentNote,
        },
      });
      return created?.id ?? null;
    })
    .not.toBeNull();

  // DB-level assertions for workflow and audit coverage
  const [updatedApplication, assignment, auditEntries] = await Promise.all([
    prisma.investorApplication.findUnique({ where: { id: applicationId } }),
    prisma.adminAssignment.findFirst({
      where: {
        createdByAdminId: adminId,
        founderUserId: founderId,
        investorUserId: investorId,
        ventureId,
        note: assignmentNote,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mutationAuditLog.findMany({
      where: {
        action: {
          in: [
            "create_investor_application",
            "update_investor_application_status",
            "admin_create_assignment",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  expect(updatedApplication?.status).toBe("REVIEWING");
  expect(assignment?.id).toBeTruthy();
  const actions = auditEntries.map((entry) => entry.action);
  expect(actions).toContain("create_investor_application");
  expect(actions).toContain("update_investor_application_status");
  expect(actions).toContain("admin_create_assignment");
});
