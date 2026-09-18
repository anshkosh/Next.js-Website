import { test, expect } from "@playwright/test";

test("AUTH-07: Route protection for /dashboard", async ({ page }) => {
  // Try to access founder dashboard without logging in
  await page.goto("/dashboard");
  
  // Should redirect to login
  await expect(page).toHaveURL(/.*\/login/);
});

test("AUTH-06: Route protection for /admin/*", async ({ page }) => {
  // Try to access admin dashboard without logging in
  await page.goto("/admin/dashboard");
  
  // Should redirect to admin login
  await expect(page).toHaveURL(/.*\/admin\/login/);
});
