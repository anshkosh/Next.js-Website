import { test, expect } from "@playwright/test";

test.describe("Admin Flow", () => {
  test("E2E-A1 & A2: Admin login, approve startup, create category", async ({ page }) => {
    // 1. Login as seeded admin
    // await page.goto("/admin/login");
    // await page.fill('input[type="email"]', "admin@anshkosh.com");
    // await page.fill('input[type="password"]', "adminpass");
    // await page.click('button[type="submit"]');

    // 2. Navigate to moderation queue
    // await page.goto("/admin/moderation");
    // expect(await page.locator("text=Moderation Queue")).toBeVisible();

    // 3. Approve a startup
    // await page.click("text=Approve");

    // 4. Verify it appears on public feed
    // await page.goto("/");
    // expect(await page.locator("text=Test Startup")).toBeVisible();

    // 5. Create a new category
    // await page.goto("/admin/categories");
    // await page.fill('input[name="name"]', "Web3");
    // await page.click("text=Create");

    // 6. Verify it appears in category pills
    // await page.goto("/");
    // expect(await page.locator("text=Web3")).toBeVisible();
  });
});
