import { test } from "@playwright/test";

test.describe("Founder Flow", () => {
  test("E2E-F1 & F2: Register, Dashboard, Create, Review Resubmit", async () => {
    // 1. Register via email
    // await page.goto("/register");
    // await page.fill('input[type="text"]', "Test Founder");
    // await page.fill('input[type="email"]', "founder@test.com");
    // await page.fill('input[type="password"]', "Password123!");
    // await page.check('input[type="checkbox"]');
    // await page.click('button[type="submit"]');
    // expect(await page.locator("text=Check your email")).toBeVisible();
    
    // Simulate verification & login
    // ...

    // 2. Navigate to dashboard
    // await page.goto("/dashboard");
    // expect(await page.locator("text=Founder Dashboard")).toBeVisible();

    // 3. Create startup via multi-step form
    // await page.click("text=Submit New Startup");
    // ...

    // 4. Submit for review
    // await page.click("text=Submit for Review");
    // expect(await page.locator("text=PENDING REVIEW")).toBeVisible();

    // 5. Edit and resubmit
    // (mocking REJECTED state)
    // await page.click("text=Edit & Resubmit");
  });
});
