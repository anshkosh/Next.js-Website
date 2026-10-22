import { test, expect, type Page, type Browser } from "@playwright/test";
import { PrismaClient, type Prisma } from "@prisma/client";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { founderEntryPath } from "../lib/founder-journal-seo";

// The upload route rewrites PDFs and rejects ones pdf-lib cannot parse, so the fixture must be a real document.
async function validPdf() {
  const doc = await PDFDocument.create();
  doc.addPage();
  return Buffer.from(await doc.save());
}

const database = new URL(process.env.DATABASE_URL || "http://invalid");
if (process.env.E2E_TEST_MODE !== "1" || !["127.0.0.1", "localhost"].includes(database.hostname) || database.pathname !== "/anshkosh_e2e") throw new Error("Browser tests only run against the isolated local anshkosh_e2e database.");
const db = new PrismaClient();
const password = "IsolatedTesting123!";
const email = `founder-${randomUUID()}@example.test`;
const adminEmail = `reviewer-${randomUUID()}@example.test`;
const originalTagline = "A pilot-ready startup built for real customers";
const startupName = `Launch Test ${randomUUID().slice(0, 8)}`;
let categoryId: string, startupId: string, slug: string;

function fixtureWidget() {
  window.turnstile = {
    render: (_container, options) => {
      setTimeout(() => { if (typeof options.callback === "function") options.callback("isolated-browser-token"); }, 0);
      return "isolated-widget";
    }, reset: () => {}, remove: () => {},
  };
}
async function isolatedContext(browser: Browser, options: Parameters<Browser["newContext"]>[0] = {}) {
  const context = await browser.newContext(options);
  await context.addInitScript(fixtureWidget);
  return context;
}

async function reveal(page: Page) {
  const peek = page.getByRole("button", { name: "Sneak peek", exact: true });
  if (await peek.isVisible()) { await peek.click(); await expect(peek).toBeHidden({ timeout: 15000 }); }
  const cookieNotice = page.getByRole("button", { name: "Dismiss cookie and browser storage notice", exact: true });
  if (await cookieNotice.isVisible()) await cookieNotice.click();
}
async function enter(page: Page, url: string) {
  await page.addInitScript(() => {
    try { localStorage.setItem("anshkosh-cookie-consent", "dismissed"); } catch { /* Test navigation must not be blocked by browser storage. */ }
  });
  await page.goto(url);
  if (new URL(page.url()).pathname !== "/") {
    await expect(page.getByRole("dialog", { name: "Anshkosh is under construction." })).toHaveCount(0);
    await expect(page.getByRole("complementary", { name: "Site status" })).toHaveCount(0);
  }
  await reveal(page);
}
async function login(page: Page, account: string, secret = password, admin = false) {
  await enter(page, admin ? "/admin/login" : "/login");
  await page.locator('input[type="email"]').fill(account);
  await page.locator(admin ? '#admin-password' : 'input[name="password"]').fill(secret);
  await page.getByRole("button", { name: admin ? "Authenticate" : /^Sign in$/i }).click();
  await expect(page).toHaveURL(admin ? /\/admin\/dashboard/ : /\/dashboard/, { timeout: 30000 });
}
async function emailLink(to: string, match: RegExp) {
  let link = "";
  await expect.poll(async () => {
    const messages = await (await fetch("http://127.0.0.1:3181/messages")).json();
    for (const message of messages.reverse()) {
      if (!message.to.some((recipient: { email: string }) => recipient.email === to)) continue;
      const candidate = [...message.htmlContent.matchAll(/href="([^"]+)"/g)].map((item: RegExpMatchArray) => item[1].replaceAll("&amp;", "&")).find((href: string) => match.test(href));
      if (candidate) { link = candidate; return true; }
    }
    return false;
  }, { timeout: 30000 }).toBe(true);
  return link;
}
async function privacyCode(to: string, subject: string) {
  let code = "";
  await expect.poll(async () => {
    const messages = await (await fetch("http://127.0.0.1:3181/messages")).json();
    for (const message of messages.reverse()) {
      if (message.subject !== subject || !message.to.some((recipient: { email: string }) => recipient.email === to)) continue;
      const match = message.textContent?.match(/\b[a-f0-9]{32}\b/);
      if (match) { code = match[0]; return true; }
    }
    return false;
  }, { timeout: 30000 }).toBe(true);
  return code;
}
async function uploadPhoto(page: Page, label: string) {
  const bytes = await sharp({ create: { width: 900, height: 600, channels: 3, background: "#ec5524" } }).png().toBuffer();
  await page.getByLabel(label, { exact: true }).setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: bytes });
  const dialog = page.getByRole("dialog").filter({ hasText: "Edit photo" });
  await expect(dialog.getByLabel("Photo crop preview")).toBeVisible();
  await dialog.getByRole("slider", { name: /^Zoom/ }).fill("1.5");
  await dialog.getByRole("slider", { name: /^Straighten/ }).fill("10");
  // Route compilation can be cold in the disposable dev server. Assert actual
  // acceptance within the same 30-second action budget, then require the UI to
  // close. A rejected upload must expose its response, not just a modal timeout.
  const upload = page.waitForResponse(response => response.request().method() === "POST" &&
    /^\/api\/uploads\/(?:logo|gallery|founder-photo)$/.test(new URL(response.url()).pathname), { timeout: 30000 });
  await dialog.getByRole("button", { name: "Apply & upload" }).click();
  const response = await upload;
  const payload = await response.json();
  expect(response.status(), typeof payload.error === "string" ? payload.error : "edited image upload accepted").toBe(200);
  expect(payload.url).toMatch(/^\/api\/uploads\/serve\/(?:logos|gallery|founders)\/[a-zA-Z0-9_-]+\.webp$/);
  await expect(dialog).toBeHidden({ timeout: 15000 });
}

test.beforeAll(async ({ request }) => {
  categoryId = (await db.category.upsert({ where: { slug: "foodtech" }, update: {}, create: { name: "FoodTech", slug: "foodtech" } })).id;
  const response = await request.post("/api/auth/sign-up/email", { headers: { origin: "http://127.0.0.1:3100" }, data: { name: "Test Reviewer", email: adminEmail, password, founderMode: true } });
  expect(response.ok()).toBe(true);
  // Fixture privilege only inside the disposable database, never an app auth bypass.
  await db.user.update({ where: { email: adminEmail }, data: { role: "admin", emailVerified: true } });
});
test.afterAll(async () => { await db.$disconnect(); });

test.beforeEach(async ({ page }) => {
  // Captured widget API; no Cloudflare connection or real challenge in tests.
  // The isolated development server has no Turnstile verification secret.
  await page.addInitScript(fixtureWidget);
});
// This serial journey shares persisted votes and network limits. Replaying it in
// the same database can obscure the first failure with leftover fixture state.
test.describe.configure({ mode: "serial", retries: 0 });
test.setTimeout(180000);

// Verify privacy controls before the longer shared startup journey.
test("private data export and confirmed deletion isolate owners, roll back failures and revoke all sessions", async ({ page, browser }) => {
  test.setTimeout(300000);
  const ownerEmail = `privacy-${randomUUID()}@example.test`;
  // The first journey uses the HTTP auth endpoint already compiled by beforeAll.
  const signup = await page.request.post("/api/auth/sign-up/email", { headers: { origin: "http://127.0.0.1:3100" }, data: { name: "Privacy fixture", email: ownerEmail, password } });
  expect(signup.status(), await signup.text()).toBe(200);
  const owner = await db.user.update({ where: { email: ownerEmail }, data: { emailVerified: true, dateOfBirth: "1996-02-29" } });
  await login(page, ownerEmail);
  const owned = await db.startup.create({ data: {
    founderId: owner.id, categoryId, name: `Privacy owned ${randomUUID()}`, slug: `privacy-${randomUUID()}`,
    tagline: "Owned privacy fixture", description: "This isolated content must be deleted only with its owner.", websiteUrl: "https://example.test", founderName: owner.name, galleryImages: [],
    revision: { create: { data: { tagline: "Pending owned revision" } } },
    betaTesterProgram: { create: { enabled: true, description: "Private tester fixture", requests: { create: { name: "Private applicant", email: "DO-NOT-EXPORT@example.test", consentedAt: new Date(), consentVersion: "isolated" } } } },
    comments: { create: { authorName: "Other commenter", authorEmail: "COMMENT-DO-NOT-EXPORT@example.test", body: "Other person's private record", reply: "Owner reply" } },
  } });
  const entry = await db.founderJournalEntry.create({ data: { authorId: owner.id, startupId: owned.id, title: "Owned journal", body: "Owned private journal content", revision: { create: { data: { title: "Pending journal" } } } } });
  const controlOwner = await db.user.findUniqueOrThrow({ where: { email: adminEmail } });
  const control = await db.startup.create({ data: { founderId: controlOwner.id, categoryId, name: "Unrelated privacy control", slug: `privacy-control-${randomUUID()}`, tagline: "Unrelated owner remains intact", description: "An isolated control that must survive another member's deletion.", websiteUrl: "https://example.test", founderName: controlOwner.name, galleryImages: [] } });
  const otherDevice = await isolatedContext(browser);
  try {
    const otherPage = await otherDevice.newPage(); await login(otherPage, ownerEmail);
    await enter(page, "/settings");
    await uploadPhoto(page, "Upload profile photo");
    const media = await db.mediaUpload.findFirstOrThrow({ where: { userId: owner.id } });
    await page.getByRole("button", { name: "Email download code", exact: true }).click();
    const downloadCode = await privacyCode(ownerEmail, "Your Anshkosh data download code");
    await page.getByLabel("Download confirmation code", { exact: true }).fill(downloadCode);
    const [exportResponse, downloaded] = await Promise.all([
      page.waitForResponse(response => response.url().endsWith("/api/account/export") && response.request().method() === "POST").then(response => { expect(response.status()).toBe(200); return response; }),
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download my data", exact: true }).click(),
    ]);
    expect(exportResponse.status()).toBe(200);
    // Chromium may omit an attachment response body from its debugging API.
    // Validate the actual saved file, including complete JSON and private fields.
    expect(await downloaded.failure()).toBeNull();
    const downloadPath = await downloaded.path();
    expect(downloadPath).not.toBeNull();
    const exported = JSON.parse(await readFile(downloadPath!, "utf8"));
    expect(exported.account.dateOfBirth).toBe("1996-02-29");
    expect(exported.startups.map((startup: { id: string }) => startup.id)).toEqual([owned.id]);
    expect(JSON.stringify(exported)).not.toContain("DO-NOT-EXPORT");
    expect(exported.linkedSignIns[0]).not.toHaveProperty("password");
    expect(downloaded.suggestedFilename()).toBe("anshkosh-account-data.json");
    expect((await page.request.post("/api/account/export", { headers: { origin: "http://127.0.0.1:3100" }, data: { code: downloadCode } })).status()).toBe(400);
    await page.getByText("Delete account…", { exact: true }).click();
    await page.getByRole("button", { name: "Email deletion code", exact: true }).click();
    const deletionCode = await privacyCode(ownerEmail, "Confirm your Anshkosh account deletion");
    expect((await page.request.post("/api/account/export", { headers: { origin: "http://127.0.0.1:3100" }, data: { code: deletionCode } })).status()).toBe(400);
    // Inject a real transaction failure after dependent rows were deleted. Every
    // content row and the confirmation proof must roll back, allowing a retry.
    const { eraseAccount } = await import("../lib/account-privacy");
    const active = await (await page.request.get("/api/auth/get-session")).json();
    const failingClient = {
      $transaction: <T,>(fn: (tx: Prisma.TransactionClient) => Promise<T>) => db.$transaction(tx => fn(new Proxy(tx, {
        get(target, property) {
          if (property === "user") return new Proxy(target.user, { get(model, method) { return method === "delete" ? async () => { throw new Error("isolated rollback injection"); } : Reflect.get(model, method); } });
          return Reflect.get(target, property);
        },
      }))),
    } as Pick<PrismaClient, "$transaction">;
    await expect(eraseAccount({ userId: owner.id, sessionId: active.session.id }, deletionCode, failingClient)).rejects.toThrow("isolated rollback injection");
    expect(await db.startup.count({ where: { id: owned.id } })).toBe(1);
    expect(await db.founderJournalEntry.count({ where: { id: entry.id } })).toBe(1);
    expect((await db.mediaUpload.findUniqueOrThrow({ where: { id: media.id } })).erasureRequestedAt).toBeNull();
    await page.getByLabel("Deletion confirmation code", { exact: true }).fill(deletionCode);
    await page.getByLabel("Type DELETE to confirm", { exact: true }).fill("DELETE");
    await page.getByRole("button", { name: "Delete my account permanently", exact: true }).click();
    await expect(page).toHaveURL(/\/account-deleted$/);
    await expect(page.getByRole("heading", { name: "Your account has been deleted", exact: true })).toBeVisible({ timeout: 30000 });
    expect(await db.user.count({ where: { id: owner.id } })).toBe(0);
    expect(await db.account.count({ where: { userId: owner.id } })).toBe(0);
    expect(await db.session.count({ where: { userId: owner.id } })).toBe(0);
    expect(await db.startup.count({ where: { id: owned.id } })).toBe(0);
    expect(await db.founderJournalEntry.count({ where: { id: entry.id } })).toBe(0);
    expect(await db.startup.count({ where: { id: control.id } })).toBe(1);
    expect(await (await otherPage.request.get("/api/auth/get-session")).json()).toBeNull();
    expect((await page.request.get(`/api/uploads/serve/${media.key}`)).status()).toBe(404);
    expect((await db.mediaUpload.findUniqueOrThrow({ where: { id: media.id } })).erasureRequestedAt).not.toBeNull();
    const { eraseQueuedAccountMedia } = await import("../lib/account-media-erasure");
    await eraseQueuedAccountMedia();
    expect(await db.mediaUpload.findUnique({ where: { id: media.id } })).toBeNull();
    expect((await fetch(`http://127.0.0.1:3181/${process.env.R2_BUCKET_NAME}/${media.key}`)).status).toBe(404);
  } finally { await otherDevice.close(); await db.startup.delete({ where: { id: control.id } }); }
});

test("signup, real verification token, login, photo editing, private deck and startup submission", async ({ page }) => {
  await enter(page, "/register");
  await page.getByLabel("Full Name", { exact: true }).fill("Test Founder");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("checkbox", { name: "Enable founder mode" }).check();
  await page.locator("#terms").check();
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await enter(page, await emailLink(email, /verify-email/));
  expect((await db.user.findUniqueOrThrow({ where: { email } })).emailVerified).toBe(true);
  await login(page, email);
  await enter(page, "/startup/new");
  await page.locator('[name="name"]').fill(startupName);
  await page.locator('[name="tagline"]').fill(originalTagline);
  await page.locator('[name="categoryId"]').selectOption(categoryId);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Step 2: Details", exact: true })).toBeVisible({ timeout: 15000 });
  await page.locator('textarea[name="description"]').fill("We are testing a repeatable food business through a local pilot, real customer feedback and a carefully measured operating model.");
  await page.locator('[name="websiteUrl"]').fill("https://example.test");
  await page.locator('[name="startupPhone"]').fill("8800776082");
  await page.locator('[name="city"]').fill("Hyderabad");
  await page.locator('[name="foundedYear"]').selectOption("2026");
  await uploadPhoto(page, "Upload startup logo");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.locator('[name="problemStatement"]').fill("Customers currently struggle to find a consistent, convenient and hygienic fresh beverage experience that they can trust and return to every week.");
  await page.locator('[name="solutionStatement"]').fill("We offer a standardized fresh beverage experience with reliable preparation, clear ingredients and service that can be repeated across multiple pilot locations.");
  await page.locator('[name="targetAudience"]').fill("Urban customers and office workers in Hyderabad");
  await page.locator('[name="prototypeStatus"]').selectOption("Preparing a pilot");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Add another founder" }).click();
  await page.getByPlaceholder("Jane Doe").fill("Test Founder");
  await uploadPhoto(page, "Upload founder photo");
  await page.getByRole("button", { name: "Save Founder" }).click();
  await expect(page.getByRole("button", { name: "Save Founder" })).toBeHidden();
  await expect(page).toHaveURL(/draft=.*step=4/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Step 4: Founders & Team" })).toBeVisible();
  await expect(page.getByText("Test Founder", { exact: true }).last()).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByLabel("Pitch deck visibility")).toHaveValue("private");
  await uploadPhoto(page, "Upload new gallery image");
  await page.getByLabel("Upload PDF pitch deck").setInputFiles({ name: "deck.pdf", mimeType: "application/pdf", buffer: await validPdf() });
  await expect(page.getByRole("link", { name: "Download uploaded pitch deck" })).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Edit media and features", exact: true }).click();
  await page.getByRole("button", { name: "Add Feature", exact: true }).click();
  await expect(page.getByLabel("Feature 1 title", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByLabel("Feature 1 title", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("Feature 1 title", { exact: true }).fill("A saved feature");
  await page.getByLabel("Feature 1 description", { exact: true }).fill("This feature should survive a browser refresh.");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("A saved feature", { exact: true })).toBeVisible();
  await expect(page.getByText("Draft saved at", { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Step 6: Review & Submit" })).toBeVisible();
  await expect(page.getByText("A saved feature", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Restore unfinished changes" })).toHaveCount(0);
  await page.getByRole("button", { name: "Submit for Review" }).click();
  // Verify the persisted result before expecting navigation through a cold
  // dashboard compilation. A button click alone does not establish a save.
  await expect.poll(async () => (await db.startup.findFirst({ where: { founder: { email } } }))?.status, { timeout: 15000 }).toBe("PENDING_REVIEW");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  const record = await db.startup.findFirstOrThrow({ where: { founder: { email } } });
  startupId = record.id; slug = record.slug;
  expect(record.status).toBe("PENDING_REVIEW"); expect(record.prototypeStatus).toBe("Preparing a pilot");
});

test("admin approves, edits remain unpublished, recovery survives refresh, revision approval publishes changes", async ({ page, browser }) => {
  await login(page, adminEmail, password, true);
  await enter(page, "/admin/moderation");
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect.poll(async () => (await db.startup.findUniqueOrThrow({ where: { id: startupId } })).status).toBe("LIVE");
  const ownerContext = await isolatedContext(browser); const ownerPage = await ownerContext.newPage();
  await login(ownerPage, email);
  await enter(ownerPage, `/startup/${startupId}/edit`);
  await ownerPage.locator('[name="tagline"]').fill("Updated pilot evidence from real customer feedback");
  await expect(ownerPage.getByRole("status").filter({ hasText: "Recovery copy saved" })).toBeVisible();
  ownerPage.on("dialog", dialog => dialog.accept()); await ownerPage.reload(); await reveal(ownerPage);
  await ownerPage.getByRole("button", { name: "Restore unfinished changes" }).click();
  await expect(ownerPage.locator('[name="tagline"]')).toHaveValue("Updated pilot evidence from real customer feedback");
  await ownerPage.getByRole("button", { name: "Save Changes" }).click(); await expect(ownerPage).toHaveURL(/\/dashboard/);
  const published = await db.startup.findUniqueOrThrow({ where: { id: startupId } });
  expect(published.status).toBe("LIVE"); expect(published.tagline).toBe(originalTagline);
  const metadata = published.metadata as { pitchDeckUrl: string };
  expect((await page.request.get(metadata.pitchDeckUrl)).status()).toBe(200); // Reviewer may read private decks.
  const anonymous = await isolatedContext(browser);
  expect((await anonymous.request.get(`http://127.0.0.1:3100${metadata.pitchDeckUrl}`)).status()).toBe(404);
  const publicPage = await anonymous.newPage(); await enter(publicPage, `/startups/${slug}`);
  await expect(publicPage.getByRole("link", { name: /pitch deck/i })).toHaveCount(0);
  await enter(page, "/admin/moderation");
  await page.getByRole("article").filter({ has: page.getByRole("heading", { name: `${startupName}: profile changes`, exact: true }) }).getByRole("button", { name: "Approve changes" }).click();
  await expect.poll(async () => (await db.startup.findUniqueOrThrow({ where: { id: startupId } })).tagline).toBe("Updated pilot evidence from real customer feedback");
  await enter(publicPage, `/startups/${slug}`); await expect(publicPage.getByText("Updated pilot evidence from real customer feedback", { exact: true })).toBeVisible();
  await anonymous.close(); await ownerContext.close();
});

test("password reset uses a delivered token and mobile forms fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page, "/forgot-password"); await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByRole("button", { name: /Send reset link/i }).click();
  await enter(page, await emailLink(email, /reset-password/));
  await page.getByLabel("New password", { exact: true }).fill("ChangedTesting123!");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByRole("heading", { name: "Password updated" })).toBeVisible();
  await login(page, email, "ChangedTesting123!"); await enter(page, `/startup/${startupId}/edit`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/startup-edit-mobile.png", fullPage: true });
});

test("public founder search and bidirectional voting share accurate signals across pages", async ({ page }) => {
  await enter(page, "/search?q=test%20founder");
  await expect(page.getByRole("heading", { name: startupName, exact: true })).toBeVisible();
  const startupResult = page.getByRole("link").filter({ has: page.getByRole("heading", { name: startupName, exact: true }) });
  await expect(startupResult.getByText("Founders: Test Founder", { exact: true })).toBeVisible();
  await enter(page, "/search?q=office%20workers");
  await expect(page.getByRole("heading", { name: startupName, exact: true })).toBeVisible();
  await enter(page, `/discover?q=${encodeURIComponent("test founder")}`);
  await expect(page.getByRole("heading", { name: startupName, exact: true })).toBeVisible();
  await enter(page, `/startups/${slug}`);
  await expect(page.getByRole("heading", { name: "Founder Updates", exact: true })).toBeVisible();
  await expect(page.getByText("No updates yet. The founder hasn’t published a progress update.", { exact: true })).toBeVisible();
  const up = () => page.getByRole("button", { name: /^(Remove upvote|Upvote)( for|,)/ });
  const down = () => page.getByRole("button", { name: /^(Remove downvote|Downvote)( for|,)/ });
  await down().click();
  await expect(down()).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => (await db.startup.findUniqueOrThrow({ where: { id: startupId } })).signalCount).toBe(-1);
  await up().click();
  await expect(up()).toHaveAttribute("aria-pressed", "true");
  await expect(down()).toHaveAttribute("aria-pressed", "false");
  await expect.poll(async () => (await db.startup.findUniqueOrThrow({ where: { id: startupId } })).signalCount).toBe(1);
  await up().click();
  await expect(up()).toHaveAttribute("aria-pressed", "false");
  await expect.poll(async () => (await db.startup.findUniqueOrThrow({ where: { id: startupId } })).signalCount).toBe(0);
  await down().click(); await expect(down()).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => (await db.startup.findUniqueOrThrow({ where: { id: startupId } })).signalCount).toBe(-1);
  await enter(page, "/leaderboard");
  const row = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: startupName, exact: true }) });
  await expect(row.getByRole("status")).toContainText("-1 signals");
  await expect(row.getByRole("button", { name: /Remove downvote/ })).toHaveAttribute("aria-pressed", "true");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await row.screenshot({ path: "test-results/net-signals-mobile.png" });
  await row.getByRole("button", { name: /Remove downvote/ }).click();
  await expect.poll(async () => (await db.startup.findUniqueOrThrow({ where: { id: startupId } })).signalCount).toBe(0);
  await enter(page, `/search?q=${encodeURIComponent(email)}`);
  await expect(page.getByRole("heading", { name: startupName, exact: true })).toHaveCount(0);
});

test("leaderboard and featured rows combine activity without leaking private or pending content", async ({ page }) => {
  const owner = await db.user.findUniqueOrThrow({ where: { email } });
  const token = randomUUID();
  const name = `Activity Test ${token.slice(0, 8)}`;
  const fixture = await db.startup.create({ data: { name, slug: `activity-${token}`, tagline: "A disposable community activity fixture", description: "For scoring tests only", websiteUrl: "https://example.test", founderName: owner.name, founderId: owner.id, categoryId, status: "LIVE" } });
  const when = new Date("2026-01-01T12:00:00Z");
  const commenter = `private-${token}@example.test`;
  try {
    await db.featuredStartup.create({ data: { startupId: fixture.id } });
    await db.startupUpdate.createMany({ data: [1, 2].map(i => ({ startupId: fixture.id, title: `Progress ${i}`, body: "Same-day progress should only count once.", createdAt: when })) });
    await db.founderJournalEntry.createMany({ data: [
      { startupId: fixture.id, authorId: owner.id, title: "Public progress", body: "Approved progress", visibility: "PUBLIC", publishedAt: when, approvedAt: when },
      { startupId: fixture.id, authorId: owner.id, title: "PRIVATE-SIGNAL-FIXTURE", body: "Private progress must never count", visibility: "PRIVATE", publishedAt: new Date("2026-01-02"), approvedAt: when },
    ] });
    await db.comment.createMany({ data: [
      { startupId: fixture.id, authorName: "Community fixture", authorEmail: commenter, body: "Approved feedback", status: "APPROVED", reply: "Founder reply", repliedAt: when, createdAt: when },
      { startupId: fixture.id, authorName: "Community fixture", authorEmail: commenter.toUpperCase(), body: "Repeat feedback", status: "APPROVED", reply: "Another reply", repliedAt: when, createdAt: when },
      { startupId: fixture.id, authorName: "Pending fixture", authorEmail: `pending-${token}@example.test`, body: "PENDING-SIGNAL-FIXTURE", status: "PENDING", createdAt: when },
    ] });
    const row = () => page.getByRole("listitem").filter({ has: page.getByRole("heading", { name, exact: true }) });
    await enter(page, "/leaderboard");
    await expect(row().getByRole("status")).toContainText("7 signals");
    await row().getByText("Signal breakdown", { exact: false }).click();
    await expect(row().getByText("Founder publishing days: 1 · 2 points", { exact: true })).toBeVisible();
    await expect(row().getByText("Community participants: 1 · 2 points", { exact: true })).toBeVisible();
    await expect(row().getByText("Founder–community discussions: 1 · 3 points", { exact: true })).toBeVisible();
    const rank = await row().getByRole("link").innerText();
    expect(await page.content()).not.toContain(commenter);
    expect(await page.content()).not.toContain("PRIVATE-SIGNAL-FIXTURE");
    expect(await page.content()).not.toContain("PENDING-SIGNAL-FIXTURE");
    await enter(page, "/");
    await expect(row().getByRole("status")).toContainText("7 signals");
    expect(await row().getByRole("link").innerText()).toContain(rank.split("\n")[0]);
    await row().getByRole("button", { name: /^Upvote/ }).click();
    await expect.poll(async () => (await db.startup.findUniqueOrThrow({ where: { id: fixture.id } })).signalCount).toBe(1);
    await expect(row().getByRole("status")).toContainText("8 signals");
    await enter(page, "/leaderboard");
    await expect(row().getByRole("status")).toContainText("8 signals");
    await page.setViewportSize({ width: 320, height: 740 });
    await row().getByText("Signal breakdown", { exact: false }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await row().screenshot({ path: "test-results/activity-signals-mobile.png" });
  } finally {
    await db.founderJournalEntry.deleteMany({ where: { startupId: fixture.id } });
    await db.startup.delete({ where: { id: fixture.id } });
  }
});

test("concurrent vote switches and reconciliation preserve one vote and correct counters", async () => {
  const { recordVote, recountVotes } = await import("../lib/vote-store");
  const fixture = await db.startup.create({ data: { name: "Concurrent vote fixture", slug: `concurrent-${randomUUID()}`, tagline: "Isolated voting fixture", description: "For concurrency testing only", websiteUrl: "https://example.test", founderName: "Test Founder", founderId: (await db.user.findUniqueOrThrow({ where: { email } })).id, categoryId, status: "LIVE" } });
  const identity = { cookieId: randomUUID(), fingerprintHash: randomUUID() };
  await recordVote(fixture.id, 1, identity);
  await Promise.all([recordVote(fixture.id, -1, identity), recordVote(fixture.id, 1, identity), recountVotes()]);
  const counts = { up: await db.upvote.count({ where: { startupId: fixture.id } }), down: await db.downvote.count({ where: { startupId: fixture.id } }) };
  expect(counts.up + counts.down).toBeLessThanOrEqual(1);
  const startup = await db.startup.findUniqueOrThrow({ where: { id: fixture.id } });
  expect(startup.upvoteCount).toBe(counts.up); expect(startup.downvoteCount).toBe(counts.down); expect(startup.signalCount).toBe(counts.up - counts.down);
  await db.startup.update({ where: { id: fixture.id }, data: { status: "SUSPENDED" } });
  expect(await recordVote(fixture.id, -1, identity)).toMatchObject({ success: false });
});

test("homepage retains the preview while navigation opens internal pages directly", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("dialog", { name: "Anshkosh is under construction." })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Site status" })).toHaveCount(1);
  await reveal(page);
  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Discover", exact: true }).click();
  await expect(page).toHaveURL(/\/discover$/);
  await expect(page.getByRole("dialog", { name: "Anshkosh is under construction." })).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Site status" })).toHaveCount(0);
  expect(await page.evaluate(() => !document.getElementById("site-content")?.inert && document.body.style.overflow !== "hidden")).toBe(true);
});

test("journal titles and bylines remain readable with and without a cover at narrow widths", async ({ page }) => {
  const post = await db.journalPost.create({ data: {
    title: "Why a student community closed with money still in the bank and what founders can learn from its decisions",
    slug: `journal-header-${randomUUID()}`, authorName: "Journal Layout Reviewer",
    coverImageUrl: "/logo.png", contentHtml: "<p>A published layout fixture.</p>",
    status: "PUBLISHED", publishedAt: new Date(), tags: [], metaKeywords: [], isFeatured: true,
  } });
  try {
    for (const coverImageUrl of ["/logo.png", null]) {
      await db.journalPost.update({ where: { id: post.id }, data: { coverImageUrl } });
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await enter(page, `/journal/${post.slug}`);
        const title = page.getByRole("heading", { level: 1, name: post.title });
        await expect(title).toBeVisible();
        // Check rendered colors against the nearest painted background, not Tailwind class names.
        for (const text of [title, page.locator("article").getByText(post.authorName, { exact: true }).first()]) {
          const contrast = await text.evaluate(element => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 1;
            const context = canvas.getContext("2d")!;
            const rgb = (color: string) => {
              context.clearRect(0, 0, 1, 1);
              context.fillStyle = color;
              context.fillRect(0, 0, 1, 1);
              return Array.from(context.getImageData(0, 0, 1, 1).data);
            };
            const luminance = (color: number[]) => color.slice(0, 3).map(value => {
              const channel = value / 255;
              return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
            }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
            let parent: Element | null = element;
            let background = [255, 255, 255];
            while (parent) {
              const color = rgb(getComputedStyle(parent).backgroundColor);
              if (color[3] > 0) { background = color; break; }
              parent = parent.parentElement;
            }
            const foreground = luminance(rgb(getComputedStyle(element).color));
            const backdrop = luminance(background);
            return (Math.max(foreground, backdrop) + 0.05) / (Math.min(foreground, backdrop) + 0.05);
          });
          expect(contrast).toBeGreaterThanOrEqual(4.5);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      }
    }
  } finally {
    await db.journalPost.delete({ where: { id: post.id } });
  }
});

test("an unhydrated login submits credentials in a POST body", async ({ browser }) => {
  const context = await isolatedContext(browser, { javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:3100/login");
    await page.getByLabel("Email address", { exact: true }).fill("native-form@example.test");
    await page.locator('input[name="password"]').fill("SyntheticNativeForm123!");
    const submission = page.waitForRequest(request => request.isNavigationRequest() && request.method() === "POST" && new URL(request.url()).pathname === "/login");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    const request = await submission;
    expect(new URL(request.url()).search).toBe("");
    expect(request.postData()).toContain("password=");
    expect(page.url()).not.toContain("SyntheticNativeForm123");
  } finally { await context.close(); }
});

test("signed-in comments prefill identity and remain privately visible while pending", async ({ page, browser }) => {
  await login(page, adminEmail, password, true);
  await page.goto("/");
  await expect(page.getByRole("dialog", { name: "Anshkosh is under construction." })).toHaveCount(0);
  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("button", { name: "Account menu for Test Reviewer", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: "Dashboard", exact: true })).toHaveAttribute("href", "/dashboard");
  await page.getByRole("menuitem", { name: "Dashboard", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  const body = `Private pending receipt ${randomUUID()}`;
  try {
    await enter(page, `/startups/${slug}`);
    await expect(page.locator("#comment-name")).toHaveValue("Test Reviewer");
    await expect(page.locator("#comment-email")).toHaveValue(adminEmail);
    await page.locator("#comment-body").fill(body);
    await expect(page.getByRole("button", { name: "Post Comment", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Post Comment", exact: true }).click();
    await expect(page.getByRole("region", { name: "Your pending comments" }).getByText(body, { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("region", { name: "Your pending comments" }).getByText(body, { exact: true })).toBeVisible();
    const stranger = await isolatedContext(browser);
    try {
      const other = await stranger.newPage(); await enter(other, `/startups/${slug}`);
      await expect(other.getByText(body, { exact: true })).toHaveCount(0);
    } finally { await stranger.close(); }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByRole("link", { name: "Contact Anshkosh", exact: true })).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  } finally { await db.comment.deleteMany({ where: { startupId, body, status: "PENDING" } }); }
});

test("founder lesson submission, update feedback and direct sign-out work together", async ({ page }) => {
  await login(page, email, "ChangedTesting123!");
  const title = `Journal regression ${randomUUID()}`;
  const updateTitle = `Update regression ${randomUUID()}`;
  try {
    await enter(page, "/dashboard/journal");
    await page.getByLabel("Entry style").selectOption("LESSON");
    await page.locator("#entry-title").fill(title);
    await page.getByRole("textbox", { name: "Your entry", exact: true }).fill("A synthetic lesson from our isolated pilot. ".repeat(15));
    await page.getByRole("radio", { name: /Public/ }).check();
    await page.getByRole("combobox").nth(1).selectOption(startupId);
    await page.getByRole("button", { name: "Submit for review", exact: true }).click();
    await expect(page.getByRole("status"), (await page.getByRole("alert").allTextContents()).join("; ")).toContainText("Submitted for review");
    await expect.poll(async () => db.founderJournalRevision.count({ where: { entry: { title, startupId }, status: "PENDING_REVIEW" } })).toBe(1);
    await page.reload();
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await enter(page, `/startup/${startupId}/updates`);
    await page.getByRole("button", { name: "Post a New Update", exact: true }).click();
    await page.locator('input[type="text"]').fill(updateTitle);
    await page.locator("textarea").fill("A synthetic progress update for an isolated fixture.");
    await page.getByRole("button", { name: "Publish Update", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Update published successfully");
    await expect.poll(async () => db.startupUpdate.count({ where: { startupId, title: updateTitle } })).toBe(1);
    const signedOut = page.waitForResponse(response => response.request().method() === "POST"
      && new URL(response.url()).pathname === "/api/auth/sign-out");
    await enter(page, "/logout");
    expect((await signedOut).ok()).toBe(true);
    await expect(page).toHaveURL(/\/login$/, { timeout: 30000 });
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  } finally {
    await db.founderJournalRevision.deleteMany({ where: { entry: { startupId, title } } });
    await db.founderJournalEntry.deleteMany({ where: { startupId, title } });
    await db.startupUpdate.deleteMany({ where: { startupId, title: updateTitle } });
    await db.startup.update({ where: { id: startupId }, data: { updateCount: await db.startupUpdate.count({ where: { startupId } }) } });
  }
});


test("member registration and profile settings work across modes without losing founder data", async ({ page }) => {
  const memberEmail = `member-${randomUUID()}@example.test`;
  await enter(page, "/register");
  await expect(page.getByRole("checkbox", { name: "Enable founder mode" })).not.toBeChecked();
  await page.getByLabel("Full Name", { exact: true }).fill("Community Member");
  await page.locator('input[type="email"]').fill(memberEmail);
  await page.locator('input[name="password"]').fill(password);
  await page.locator("#terms").check();
  await page.getByRole("button", { name: "Create Account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await enter(page, await emailLink(memberEmail, /verify-email/));
  await login(page, memberEmail);
  await expect(page.getByRole("link", { name: "Explore startups", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Submit a new startup" })).toHaveCount(0);
  await enter(page, "/settings");
  await page.getByLabel("Full name", { exact: true }).fill("Updated Community Member");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Profile saved." })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue("Updated Community Member");
  await enter(page, "/dashboard");
  await page.getByRole("switch", { name: /Founder mode/ }).click();
  await expect(page.getByRole("link", { name: "Submit a new startup", exact: true })).toBeVisible();
  const member = await db.user.findUniqueOrThrow({ where: { email: memberEmail } });
  const modeStartup = await db.startup.create({ data: { name: `Mode test ${randomUUID()}`, slug: `mode-${randomUUID()}`, tagline: "A preserved account preference fixture", description: "This fixture verifies that founder mode never deletes saved work.", websiteUrl: "https://example.test", founderName: member.name, founderId: member.id, categoryId, status: "DRAFT" } });
  const before = await db.startup.findUniqueOrThrow({ where: { id: modeStartup.id } });
  await enter(page, "/dashboard");
  await page.getByRole("switch", { name: /Founder mode/ }).click();
  await expect(page.getByRole("link", { name: "Explore startups", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.screenshot({ path: ".impeccable/review/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.screenshot({ path: ".impeccable/review/mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await enter(page, "/dashboard");
  await expect(page.getByRole("link", { name: "Explore startups", exact: true })).toBeVisible();
  const after = await db.startup.findUniqueOrThrow({ where: { id: modeStartup.id } });
  expect(after).toEqual(before);
  await enter(page, "/dashboard");
  await page.getByRole("switch", { name: /Founder mode/ }).click();
  await expect.poll(async () => (await db.user.findUniqueOrThrow({ where: { id: member.id } })).founderMode).toBe(true);
  await enter(page, "/dashboard");
  await expect(page.getByRole("heading", { name: modeStartup.name, exact: true })).toBeVisible();
});

test("founder mode hides every owned startup publicly and restores approved visibility without losing data", async ({ page, browser }) => {
  test.setTimeout(300000);
  const visibilityEmail = `visibility-${randomUUID()}@example.test`;
  const signup = await page.request.post("/api/auth/sign-up/email", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: { name: "Visibility Founder", email: visibilityEmail, password, founderMode: true },
  });
  expect(signup.ok()).toBe(true);
  const owner = await db.user.update({ where: { email: visibilityEmail }, data: { emailVerified: true } });
  const fixtures = await Promise.all(["LIVE", "LIVE", "DRAFT", "SUSPENDED"].map((status, index) => db.startup.create({ data: {
    name: `Visibility fixture ${index} ${randomUUID()}`, slug: `visibility-${randomUUID()}`,
    tagline: "Visibility changes preserve all saved startup data", description: "An isolated fixture for founder mode public visibility.",
    websiteUrl: "https://example.test", founderName: owner.name, founderId: owner.id, categoryId,
    status: status as "LIVE" | "DRAFT" | "SUSPENDED",
  } })));
  const [live] = fixtures;
  const teamName = `Visibility team ${randomUUID()}`;
  await db.startupFounder.create({ data: { startupId: live.id, name: teamName } });
  const reviewer = await db.user.findUniqueOrThrow({ where: { email: adminEmail } });
  const control = await db.startup.create({ data: { name: "Visible control startup", slug: `control-${randomUUID()}`, tagline: "A different owner remains visible", description: "An isolated public visibility control.", websiteUrl: "https://example.test", founderName: reviewer.name, founderId: reviewer.id, categoryId, status: "LIVE" } });
  // A historical address can be reused by a current startup. Hiding the
  // current startup must not resurrect this redirect to a different owner.
  await db.slugRedirect.create({ data: { oldSlug: live.slug, startupId: control.id } });
  await db.featuredStartup.create({ data: { startupId: live.id, sortOrder: -100 } });
  const entry = await db.founderJournalEntry.create({ data: {
    authorId: owner.id, startupId: live.id, title: `Visibility story ${randomUUID()}`, body: "A preserved approved story.",
    visibility: "PUBLIC", approvedAt: new Date(), publishedAt: new Date(),
  } });
  const oldSlug = `old-${live.slug}`;
  await db.slugRedirect.create({ data: { oldSlug, startupId: live.id } });
  const visitor = await isolatedContext(browser);
  try {
    const direct = (slug: string) => `/startups/${slug}`;
    const storyPath = founderEntryPath(entry);
    const publicPages = ["/", "/discover", "/leaderboard", "/category/foodtech", `/search?q=${encodeURIComponent(live.name)}`];
    // Warm and assert visible pages before changing mode, so cached public reads
    // and redirects are exercised as well as new requests.
    for (const fixture of fixtures.slice(0, 2)) {
      expect((await visitor.request.get(direct(fixture.slug))).status()).toBe(200);
    }
    expect((await visitor.request.get(storyPath)).status()).toBe(200);
    const publicTeam = await visitor.request.get(`/api/startups/${live.id}/founders`);
    expect(publicTeam.headers()["cache-control"]).toContain("no-store");
    expect((await publicTeam.json()).data).toEqual([expect.objectContaining({ name: teamName })]);
    expect((await visitor.request.get(direct(oldSlug))).url()).toContain(direct(live.slug));
    expect(await (await visitor.request.get("/discover")).text()).toContain(`href="${direct(live.slug)}"`);
    expect(await (await visitor.request.get("/sitemap.xml")).text()).toContain(storyPath);
    for (const route of publicPages) await visitor.request.get(route);
    await login(page, visibilityEmail);
    await enter(page, "/dashboard");
    await page.getByRole("switch", { name: /Founder mode/ }).click();
    await expect.poll(async () => (await db.user.findUniqueOrThrow({ where: { id: owner.id } })).founderMode).toBe(false);
    await expect(page.getByRole("link", { name: "Explore startups", exact: true })).toBeVisible();

    for (const fixture of fixtures) {
      expect((await visitor.request.get(direct(fixture.slug))).status()).toBe(404);
      expect((await visitor.request.get(`/api/og/${fixture.slug}`)).status()).toBe(404);
    }
    expect((await visitor.request.get(direct(oldSlug))).status()).toBe(404);
    expect((await visitor.request.get(storyPath)).status()).toBe(404);
    expect((await (await visitor.request.get(`/api/startups/${live.id}/founders`)).json()).data).toEqual([]);
    expect((await (await page.request.get(`/api/startups/${live.id}/founders`)).json()).data).toEqual([expect.objectContaining({ name: teamName })]);
    expect((await visitor.request.get(direct(control.slug))).status()).toBe(200);
    // The storage action must reject a mutation from a previously open page too.
    const { recordVote } = await import("../lib/vote-store");
    expect(await recordVote(live.id, 1, { cookieId: randomUUID(), fingerprintHash: randomUUID() })).toMatchObject({ success: false });
    expect(await db.upvote.count({ where: { startupId: live.id } })).toBe(0);
    for (const route of [...publicPages, "/sitemap.xml"]) {
      const html = await (await visitor.request.get(route)).text();
      for (const fixture of fixtures) expect(html).not.toContain(`href="${direct(fixture.slug)}"`);
      if (route === "/sitemap.xml") {
        expect(html).not.toContain(live.slug);
        expect(html).not.toContain(storyPath);
      }
    }
    // Public URLs stay hidden even when their owner is the visitor.
    expect((await page.request.get(direct(live.slug))).status()).toBe(404);
    const after = await Promise.all(fixtures.map(fixture => db.startup.findUniqueOrThrow({ where: { id: fixture.id } })));
    expect(after).toEqual(fixtures);
    expect(await db.founderJournalEntry.findUniqueOrThrow({ where: { id: entry.id } })).toEqual(entry);

    await page.getByRole("switch", { name: /Founder mode/ }).click();
    await expect.poll(async () => (await db.user.findUniqueOrThrow({ where: { id: owner.id } })).founderMode).toBe(true);
    for (const fixture of fixtures.slice(0, 2)) expect((await visitor.request.get(direct(fixture.slug))).status()).toBe(200);
    for (const fixture of fixtures.slice(2)) expect((await visitor.request.get(direct(fixture.slug))).status()).toBe(404);
    expect((await visitor.request.get(storyPath)).status()).toBe(200);
    expect((await visitor.request.get(direct(oldSlug))).url()).toContain(direct(live.slug));
    expect(await (await visitor.request.get("/discover")).text()).toContain(`href="${direct(live.slug)}"`);
    expect(await (await visitor.request.get("/sitemap.xml")).text()).toContain(storyPath);
  } finally {
    await visitor.close();
    await db.founderJournalEntry.deleteMany({ where: { authorId: owner.id } });
    await db.slugRedirect.deleteMany({ where: { startupId: { in: [live.id, control.id] } } });
    await db.featuredStartup.deleteMany({ where: { startupId: live.id } });
    await db.startup.deleteMany({ where: { founderId: owner.id } });
    await db.startup.delete({ where: { id: control.id } });
    await db.user.delete({ where: { id: owner.id } });
  }
});

test("expanded profile, optional emails and verified sign-in changes persist", async ({ page, browser }) => {
  test.setTimeout(300000);
  const originalEmail = `profile-${randomUUID()}@example.test`;
  const changedEmail = `changed-${randomUUID()}@example.test`;
  const changedPassword = "NewProfilePassword123!";
  const signup = await page.request.post("/api/auth/sign-up/email", { headers: { origin: "http://127.0.0.1:3100" }, data: { name: "Profile Member", email: originalEmail, password } });
  expect(signup.ok()).toBe(true);
  const member = await db.user.update({ where: { email: originalEmail }, data: { emailVerified: true } });
  await login(page, originalEmail);
  await enter(page, "/settings");
  await expect(page.getByRole("switch", { name: /Founder mode/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Change password", exact: true })).toHaveAttribute("href", "#change-password");
  await page.getByLabel("Date of birth", { exact: false }).fill("1996-02-29");
  await uploadPhoto(page, "Upload profile photo");
  await page.getByLabel("Bio", { exact: true }).fill("A member interested in useful early-stage products.");
  await page.getByLabel("Location", { exact: true }).fill("Hyderabad");
  await page.getByLabel("Website", { exact: true }).fill("https://example.test/member");
  await page.getByRole("checkbox", { name: /Startup review updates/ }).uncheck();
  await page.getByRole("checkbox", { name: /Vote milestones/ }).uncheck();
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  // Cold compilation plus the owned-photo check can exceed the five-second
  // assertion default on CI. Still require the real confirmed save.
  await expect(page.getByText("Profile saved.", { exact: true })).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(/Saved at/)).toBeVisible();
  await page.reload();
  const saved = await db.user.findUniqueOrThrow({ where: { id: member.id } });
  expect(saved).toMatchObject({ bio: "A member interested in useful early-stage products.", location: "Hyderabad", websiteUrl: "https://example.test/member", dateOfBirth: "1996-02-29", notifyStartupReviews: false, notifyVoteMilestones: false });
  await expect(page.getByLabel("Date of birth", { exact: false })).toHaveValue("1996-02-29");
  expect(saved.image).toMatch(/^\/api\/uploads\/serve\/founders\//);
  await expect(page.getByLabel("Bio", { exact: true })).toHaveValue(saved.bio);
  await expect(page.getByRole("checkbox", { name: /Vote milestones/ })).not.toBeChecked();
  const { emailQueue } = await import("../lib/jobs/queues");
  const job = await emailQueue.add("preference-fixture", { template: "upvote_milestone", to: originalEmail, data: { startupName: "Preference fixture", milestone: 10, slug: "fixture" } });
  await expect.poll(() => job.getState()).toBe("completed");
  const captured = await (await fetch("http://127.0.0.1:3181/messages")).json();
  expect(captured.some((message: { to: { email: string }[]; subject: string }) => message.to.some(recipient => recipient.email === originalEmail) && message.subject.includes("Preference fixture"))).toBe(false);

  await page.getByLabel("New email address", { exact: true }).fill(changedEmail);
  await page.getByRole("button", { name: "Change email", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Check your current email" })).toBeVisible();
  expect((await db.user.findUniqueOrThrow({ where: { id: member.id } })).email).toBe(originalEmail);
  await enter(page, await emailLink(originalEmail, /verify-email/));
  expect((await db.user.findUniqueOrThrow({ where: { id: member.id } })).email).toBe(originalEmail);
  await enter(page, await emailLink(changedEmail, /verify-email/));
  await expect.poll(async () => (await db.user.findUniqueOrThrow({ where: { id: member.id } })).email).toBe(changedEmail);
  await expect(page.getByText(changedEmail, { exact: false }).first()).toBeVisible();

  const otherDevice = await isolatedContext(browser);
  try {
    const otherPage = await otherDevice.newPage();
    await login(otherPage, changedEmail);
    await page.getByLabel("Current password", { exact: true }).fill(password);
    await page.getByLabel("New password", { exact: true }).fill(changedPassword);
    await page.getByLabel("Confirm new password", { exact: true }).fill(changedPassword);
    await page.getByRole("button", { name: "Update password", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Password updated." })).toBeVisible();
    await otherPage.goto("/dashboard");
    await expect(otherPage).toHaveURL(/\/login$/);
    await login(otherPage, changedEmail, changedPassword);
    await page.getByRole("button", { name: "Sign out other sessions", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Other sessions signed out." })).toBeVisible();
    await otherPage.goto("/dashboard");
    await expect(otherPage).toHaveURL(/\/login$/);
    await page.reload();
    await expect(page.getByLabel("Bio", { exact: true })).toHaveValue(saved.bio);
    await expect(page.getByRole("button", { name: "Save profile", exact: true })).toBeEnabled();
    for (const width of [1366, 768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `.impeccable/review/settings-${width}.png`, fullPage: true });
    }
  } finally { await otherDevice.close(); }
});
