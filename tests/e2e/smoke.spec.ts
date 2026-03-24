import { expect, test } from "@playwright/test";

test("public homepage and login page are reachable", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("body")).toContainText("Webcoin Labs");

  await page.goto("/login");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("body")).toContainText("Sign in");
});

test("protected OS routes enforce auth", async ({ page }) => {
  const protectedRoutes = [
    "/app/founder-os",
    "/app/builder-os",
    "/app/investor-os",
    "/app/admin",
  ];

  for (const route of protectedRoutes) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/(login|auth\/signin)(\?|$)/);
  }
});
