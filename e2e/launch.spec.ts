import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { PDFDocument } from "pdf-lib";

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
async function uploadPhoto(page: Page, label: string) {
  const bytes = await sharp({ create: { width: 900, height: 600, channels: 3, background: "#ec5524" } }).png().toBuffer();
  await page.getByLabel(label, { exact: true }).setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: bytes });
  const dialog = page.getByRole("dialog").filter({ hasText: "Edit photo" });
  await expect(dialog.getByLabel("Photo crop preview")).toBeVisible();
  await dialog.getByRole("slider", { name: /^Zoom/ }).fill("1.5");
  await dialog.getByRole("slider", { name: /^Straighten/ }).fill("10");
  await dialog.getByRole("button", { name: "Apply & upload" }).click();
  await expect(dialog).toBeHidden({ timeout: 15000 });
}

test.beforeAll(async ({ request }) => {
  categoryId = (await db.category.upsert({ where: { slug: "foodtech" }, update: {}, create: { name: "FoodTech", slug: "foodtech" } })).id;
  const response = await request.post("/api/auth/sign-up/email", { headers: { origin: "http://127.0.0.1:3100" }, data: { name: "Test Reviewer", email: adminEmail, password } });
  expect(response.ok()).toBe(true);
  // Fixture privilege only inside the disposable database, never an app auth bypass.
  await db.user.update({ where: { email: adminEmail }, data: { role: "admin", emailVerified: true } });
});
test.afterAll(async () => { await db.$disconnect(); });
test.describe.configure({ mode: "serial" });
test.setTimeout(180000);

test("signup, real verification token, login, photo editing, private deck and startup submission", async ({ page }) => {
  await enter(page, "/register");
  await page.getByLabel("Full Name", { exact: true }).fill("Test Founder");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[type="checkbox"]').check();
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
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByLabel("Pitch deck visibility")).toHaveValue("private");
  await uploadPhoto(page, "Upload new gallery image");
  await page.getByLabel("Upload PDF pitch deck").setInputFiles({ name: "deck.pdf", mimeType: "application/pdf", buffer: await validPdf() });
  await expect(page.getByRole("link", { name: "Download uploaded pitch deck" })).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Submit for Review" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  const record = await db.startup.findFirstOrThrow({ where: { founder: { email } } });
  startupId = record.id; slug = record.slug;
  expect(record.status).toBe("PENDING_REVIEW"); expect(record.prototypeStatus).toBe("Preparing a pilot");
});

test("admin approves, edits remain unpublished, recovery survives refresh, revision approval publishes changes", async ({ page, browser }) => {
  await login(page, adminEmail, password, true);
  await enter(page, "/admin/moderation");
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect.poll(async () => (await db.startup.findUniqueOrThrow({ where: { id: startupId } })).status).toBe("LIVE");
  const ownerContext = await browser.newContext(); const ownerPage = await ownerContext.newPage();
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
  const anonymous = await browser.newContext();
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
  await expect(page.getByText("Founders: Test Founder", { exact: true })).toBeVisible();
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
