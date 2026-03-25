import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const nonce = `${Date.now()}`;
const password = "WebcoinPublicPass1";

const founderEmail = `e2e-public-founder-${nonce}@webcoinlabs.test`;
const builderEmail = `e2e-public-builder-${nonce}@webcoinlabs.test`;
const investorEmail = `e2e-public-investor-${nonce}@webcoinlabs.test`;

const founderUsername = `public_founder_${nonce}`;
const builderUsername = `public_builder_${nonce}`;
const investorUsername = `public_investor_${nonce}`;
const companySlug = `public-fund-${nonce}`;

let founderId = "";
let builderId = "";
let investorId = "";

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
      username: founderUsername,
      name: "Public Founder",
      role: "FOUNDER",
      onboardingComplete: true,
      password: passwordHash,
      founderProfile: {
        create: {
          publicVisible: true,
          companyName: "Public Founder Co",
          companyDescription: "Founder public visibility test company",
          telegram: "@founder_hidden",
          linkedin: "https://linkedin.com/in/founder-hidden",
        },
      },
      publicProfileSettings: {
        create: {
          showEmailToInvestors: false,
          showLinkedinToInvestors: false,
          showTelegramToInvestors: false,
        },
      },
    },
  });
  founderId = founder.id;

  const builder = await prisma.user.create({
    data: {
      email: builderEmail,
      username: builderUsername,
      name: "Public Builder",
      role: "BUILDER",
      onboardingComplete: true,
      password: passwordHash,
      builderProfile: {
        create: {
          publicVisible: true,
          title: "Builder",
          headline: "Public builder profile",
          skills: ["solidity", "typescript"],
          linkedin: "https://linkedin.com/in/builder-hidden",
        },
      },
      publicProfileSettings: {
        create: {
          showEmailToInvestors: false,
          showLinkedinToInvestors: false,
        },
      },
    },
  });
  builderId = builder.id;

  const company = await prisma.investorCompany.create({
    data: {
      slug: companySlug,
      name: `Public Fund ${nonce}`,
      isPublic: true,
      description: "Public investor company",
    },
  });

  const investor = await prisma.user.create({
    data: {
      email: investorEmail,
      username: investorUsername,
      name: "Public Investor",
      role: "INVESTOR",
      onboardingComplete: true,
      password: passwordHash,
      investorProfile: {
        create: {
          isPublic: true,
          roleTitle: "Partner",
          investmentThesis: "Public profile coverage",
          companyId: company.id,
        },
      },
      investorCompanyMemberships: {
        create: {
          companyId: company.id,
          isPrimary: true,
          roleTitle: "Partner",
        },
      },
    },
  });
  investorId = investor.id;
});

test.afterAll(async () => {
  await prisma.user.deleteMany({
    where: { id: { in: [founderId, builderId, investorId].filter(Boolean) } },
  });
  await prisma.$disconnect();
});

test("public URL coverage and contact leakage protections", async ({ page }) => {
  // Anonymous checks
  await page.goto(`/founder/${founderUsername}`);
  await expect(page.getByRole("heading", { name: "Public Founder" })).toBeVisible();
  await expect(page.locator('a[aria-label="Email"]')).toHaveCount(0);
  await expect(page.locator('a[aria-label="LinkedIn"]')).toHaveCount(0);
  await expect(page.locator('a[aria-label="Telegram"]')).toHaveCount(0);

  await page.goto(`/builder/${builderUsername}`);
  await expect(page.getByRole("heading", { name: "Public Builder" })).toBeVisible();
  await expect(page.locator('a[aria-label="Email"]')).toHaveCount(0);
  await expect(page.locator('a[aria-label="LinkedIn"]')).toHaveCount(0);

  await page.goto(`/investor/${investorUsername}`);
  await expect(page.getByText("Investor Public Profile")).toBeVisible();

  await page.goto(`/investor/${companySlug}`);
  await expect(page.getByText("Investor Company Public Page")).toBeVisible();

  await page.goto(`/investor/${companySlug}/${investorUsername}`);
  await expect(page.getByText("Firm-Affiliated Investor")).toBeVisible();

  // Logged-in investor still respects hidden founder/builder contact settings.
  await signIn(page, investorEmail, password);
  await page.goto(`/founder/${founderUsername}`);
  await expect(page.locator('a[aria-label="Email"]')).toHaveCount(0);
  await expect(page.locator('a[aria-label="LinkedIn"]')).toHaveCount(0);
  await expect(page.locator('a[aria-label="Telegram"]')).toHaveCount(0);
});

