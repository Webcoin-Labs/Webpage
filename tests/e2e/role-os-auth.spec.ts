import { expect, test, type Page } from "@playwright/test";
import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const basePassword = "WebcoinE2EPass1";
const nonce = `${Date.now()}`;

type SeedUser = {
  role: Role;
  email: string;
  username: string;
  name: string;
};

const seededUsers: SeedUser[] = [
  {
    role: "FOUNDER",
    email: `e2e-founder-${nonce}@webcoinlabs.test`,
    username: `e2e_founder_${nonce}`,
    name: "E2E Founder",
  },
  {
    role: "BUILDER",
    email: `e2e-builder-${nonce}@webcoinlabs.test`,
    username: `e2e_builder_${nonce}`,
    name: "E2E Builder",
  },
  {
    role: "INVESTOR",
    email: `e2e-investor-${nonce}@webcoinlabs.test`,
    username: `e2e_investor_${nonce}`,
    name: "E2E Investor",
  },
  {
    role: "ADMIN",
    email: `e2e-admin-${nonce}@webcoinlabs.test`,
    username: `e2e_admin_${nonce}`,
    name: "E2E Admin",
  },
];

async function signIn(page: Page, login: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email or username").fill(login);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app/);
}

test.beforeAll(async () => {
  const passwordHash = await hash(basePassword, 12);

  await Promise.all(
    seededUsers.map((user) =>
      prisma.user.create({
        data: {
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
          onboardingComplete: true,
          password: passwordHash,
        },
      }),
    ),
  );
});

test.afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { in: seededUsers.map((user) => user.email) } },
  });
  await prisma.$disconnect();
});

test("founder can access Founder OS", async ({ page }) => {
  const founder = seededUsers.find((user) => user.role === "FOUNDER");
  if (!founder) throw new Error("Founder seed user missing");

  await signIn(page, founder.email, basePassword);
  await page.goto("/app/founder-os");
  await expect(page.getByRole("heading", { name: "Founder OS" })).toBeVisible();
});

test("builder can access Builder OS and is blocked from Admin", async ({ page }) => {
  const builder = seededUsers.find((user) => user.role === "BUILDER");
  if (!builder) throw new Error("Builder seed user missing");

  await signIn(page, builder.email, basePassword);
  await page.goto("/app/builder-os");
  await expect(page.getByRole("heading", { name: "Builder OS" })).toBeVisible();

  await page.goto("/app/admin");
  await expect(page).toHaveURL(/\/app$/);
});

test("investor can access Investor OS", async ({ page }) => {
  const investor = seededUsers.find((user) => user.role === "INVESTOR");
  if (!investor) throw new Error("Investor seed user missing");

  await signIn(page, investor.email, basePassword);
  await page.goto("/app/investor-os");
  await expect(page.getByRole("heading", { name: "Investor OS" })).toBeVisible();
});

test("admin can access Admin OS", async ({ page }) => {
  const admin = seededUsers.find((user) => user.role === "ADMIN");
  if (!admin) throw new Error("Admin seed user missing");

  await signIn(page, admin.email, basePassword);
  await page.goto("/app/admin");
  await expect(page.getByRole("heading", { name: /^Admin$/ })).toBeVisible();
});
