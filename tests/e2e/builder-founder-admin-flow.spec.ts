import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const nonce = `${Date.now()}`;
const password = "WebcoinFlowPass1";
const founderEmail = `e2e-jobs-founder-${nonce}@webcoinlabs.test`;
const builderEmail = `e2e-jobs-builder-${nonce}@webcoinlabs.test`;
const adminEmail = `e2e-jobs-admin-${nonce}@webcoinlabs.test`;
const jobTitle = `E2E Builder Role ${nonce}`;
const assignmentNote = `Builder to founder routing ${nonce}`;

let founderId = "";
let builderId = "";
let adminId = "";
let jobId = "";
let jobApplicationId = "";

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
      username: `e2e_jobs_founder_${nonce}`,
      name: "E2E Jobs Founder",
      role: "FOUNDER",
      onboardingComplete: true,
      password: passwordHash,
    },
  });
  founderId = founder.id;

  const builder = await prisma.user.create({
    data: {
      email: builderEmail,
      username: `e2e_jobs_builder_${nonce}`,
      name: "E2E Jobs Builder",
      role: "BUILDER",
      onboardingComplete: true,
      password: passwordHash,
    },
  });
  builderId = builder.id;

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      username: `e2e_jobs_admin_${nonce}`,
      name: "E2E Jobs Admin",
      role: "ADMIN",
      onboardingComplete: true,
      password: passwordHash,
    },
  });
  adminId = admin.id;
});

test.afterAll(async () => {
  await prisma.user.deleteMany({
    where: {
      id: { in: [founderId, builderId, adminId].filter(Boolean) },
    },
  });
  await prisma.$disconnect();
});

test("builder applies to founder role and admin routes assignment", async ({ page }) => {
  // Founder creates an opportunity (job post).
  await signIn(page, founderEmail, password);
  await page.goto("/app/jobs");
  await page.locator('input[name="title"]').fill(jobTitle);
  await page.locator('input[name="company"]').fill("E2E Labs");
  await page.locator('textarea[name="description"]').fill(
    "Seeking a smart contract engineer for our production launch pipeline with strong execution discipline.",
  );
  await page.locator('input[name="skillsRequired"]').fill("solidity,typescript,security");
  await page.getByRole("button", { name: "Create Job Post" }).click();
  await expect(page.getByText("Job post created.")).toBeVisible();

  await expect
    .poll(async () => {
      const created = await prisma.jobPost.findFirst({
        where: { createdByUserId: founderId, title: jobTitle },
        orderBy: { createdAt: "desc" },
      });
      return created?.id ?? null;
    })
    .not.toBeNull();
  const createdJob = await prisma.jobPost.findFirst({
    where: { createdByUserId: founderId, title: jobTitle },
    orderBy: { createdAt: "desc" },
  });
  jobId = createdJob!.id;

  await page.context().clearCookies();

  // Builder applies.
  await signIn(page, builderEmail, password);
  await page.goto("/app/jobs");
  const jobCard = page.locator("div").filter({ hasText: jobTitle }).first();
  await expect(jobCard).toBeVisible();
  await jobCard.getByRole("button", { name: "Apply" }).click();
  await jobCard.locator('textarea[name="message"]').fill(
    "I have shipped audited Solidity systems and can own delivery from spec to deployment.",
  );
  await jobCard.locator('input[name="resumeUrl"]').fill("https://example.com/resume-builder.pdf");
  await jobCard.getByRole("button", { name: "Submit" }).click();
  await expect(jobCard.getByText("Application submitted.")).toBeVisible();

  await expect
    .poll(async () => {
      const created = await prisma.jobApplication.findFirst({
        where: { jobId, userId: builderId },
        orderBy: { createdAt: "desc" },
      });
      return created?.id ?? null;
    })
    .not.toBeNull();
  const createdApplication = await prisma.jobApplication.findFirst({
    where: { jobId, userId: builderId },
    orderBy: { createdAt: "desc" },
  });
  jobApplicationId = createdApplication!.id;

  await page.context().clearCookies();

  // Admin reviews candidate and routes assignment.
  await signIn(page, adminEmail, password);
  await page.goto("/app/admin/jobs");
  const applicationCard = page
    .locator("div")
    .filter({ hasText: jobTitle })
    .filter({ hasText: "E2E Jobs Builder" })
    .first();
  await expect(applicationCard).toBeVisible();
  await applicationCard.getByRole("button", { name: "SHORTLISTED" }).click();

  await expect
    .poll(async () => {
      const updated = await prisma.jobApplication.findUnique({
        where: { id: jobApplicationId },
        select: { status: true },
      });
      return updated?.status ?? null;
    })
    .toBe("SHORTLISTED");

  await page.goto("/app/admin");
  await page.locator('select[name="type"]').selectOption("BUILDER_TO_FOUNDER");
  await page.locator('input[name="founderUserId"]').fill(founderId);
  await page.locator('input[name="builderUserId"]').fill(builderId);
  await page.locator('input[name="ventureId"]').fill("");
  await page.locator('textarea[name="note"]').fill(assignmentNote);
  await page.getByRole("button", { name: "Create assignment" }).click();

  await expect
    .poll(async () => {
      const created = await prisma.adminAssignment.findFirst({
        where: {
          createdByAdminId: adminId,
          founderUserId: founderId,
          builderUserId: builderId,
          type: "BUILDER_TO_FOUNDER",
          note: assignmentNote,
        },
      });
      return created?.id ?? null;
    })
    .not.toBeNull();
});

