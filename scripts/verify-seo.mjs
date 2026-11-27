import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

// Read-only HTTP smoke check. Run against a local/preview build before publishing.
const origin = process.argv[2] || "http://localhost:3011";
const canonicalOrigin = process.argv[3] || "https://www.anshkosh.com";
const publicPaths = ["/", "/discover", "/leaderboard", "/categories", "/journal", "/faq", "/about", "/contact", "/privacy", "/terms", "/trust-safety"];

async function get(path, userAgent) {
  const response = await fetch(new URL(path, origin), {
    signal: AbortSignal.timeout(60000),
    headers: userAgent ? { "user-agent": userAgent } : undefined,
  });
  const text = await response.text();
  return { response, text, document: new JSDOM(text).window.document };
}

for (const path of publicPaths) {
  const { response, document } = await get(path);
  assert.equal(response.status, 200, `${path}: status`);
  assert.equal(document.querySelectorAll("h1").length, 1, `${path}: one H1`);
  assert.ok(document.title.includes("Anshkosh"), `${path}: branded title`);
  assert.ok(document.querySelector('meta[name="description"]')?.content, `${path}: description`);
  assert.equal(document.querySelector('link[rel="canonical"]')?.href, `${canonicalOrigin}${path}`, `${path}: canonical`);
  assert.ok(![...document.querySelectorAll('meta[name="robots"]')].some(meta => meta.content.includes("noindex")), `${path}: indexable`);
  assert.equal(document.querySelector('meta[property="og:image"]')?.content, `${canonicalOrigin}/images/hero-pomegranate-v2.webp`, `${path}: social image`);
  if (path === "/") {
    const icons = [...document.querySelectorAll('link[rel="icon"]')];
    assert.deepEqual(icons.map(icon => icon.getAttribute("href")), ["/favicon.png"], "One stable favicon URL");
  }
  if (path === "/faq") {
    const faq = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map(script => JSON.parse(script.textContent)).find(schema => schema["@type"] === "FAQPage");
    assert.ok(Array.isArray(faq?.mainEntity) && faq.mainEntity.length > 0, "Published FAQ questions are present");
    const answers = [...document.querySelectorAll('[data-slot="accordion-content"]')];
    assert.equal(answers.length, faq.mainEntity.length, "Every published FAQ answer is server-rendered");
    assert.ok(answers.every(answer => answer.textContent.trim()), "FAQ answers are not empty");
    assert.deepEqual([...document.querySelectorAll('h2 [data-slot="accordion-trigger"]')].map(trigger => trigger.textContent.trim()), faq.mainEntity.map(question => question.name), "FAQ heading hierarchy matches every published question");
  }
  assert.equal(document.querySelectorAll(".curtain-stage").length, 0, `${path}: no entry curtain`);
  assert.equal(document.querySelectorAll('aside[aria-label="Site status"]').length, 0, `${path}: no construction banner`);
  console.log(`PASS ${path}: status, canonical, metadata, H1, social image`);
}

for (const [path, canonicalPath] of [
  ["/journal?page=2", "/journal?page=2"],
  ["/journal?page=1", "/journal"],
]) {
  const { response, document } = await get(path);
  assert.equal(response.status, 200, `${path}: status`);
  const canonicals = document.querySelectorAll('link[rel="canonical"]');
  assert.equal(canonicals.length, 1, `${path}: one canonical`);
  assert.equal(canonicals[0].href, `${canonicalOrigin}${canonicalPath}`, `${path}: canonical`);
  console.log(`PASS ${path}: pagination canonical`);
}

for (const path of ["/journal/seo-check-nonexistent-article", "/startups/seo-check-nonexistent-startup", "/category/seo-check-nonexistent-category", "/seo-check-nonexistent-page"]) {
  for (const agent of [undefined, "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"]) {
    const { response, text, document } = await get(path, agent);
    assert.equal(response.status, 404, `${path}: real 404`);
    assert.ok([...document.querySelectorAll('meta[name="robots"]')].some(meta => meta.content.includes("noindex")), `${path}: noindex`);
    assert.ok(!text.includes("Something went wrong"), `${path}: not an error page`);
  }
  console.log(`PASS ${path}: 404 + noindex for regular and simulated crawler requests`);
}

for (const path of ["/favicon.ico", "/favicon.ico?603d046c9a6fdfbb", "/icon.svg", "/icon.svg?2c93d423c2c95545"]) {
  const response = await fetch(new URL(path, origin), { redirect: "manual" });
  assert.equal(response.status, 308, path + ": permanent redirect");
  assert.equal(response.headers.get("location"), "/favicon.png", path + ": clean favicon URL");
}
const favicon = await fetch(new URL("/favicon.png", origin), { redirect: "manual" });
assert.equal(favicon.status, 200, "Favicon is served directly");
assert.equal(favicon.headers.get("content-type"), "image/png", "Favicon MIME type");
const faviconBytes = Buffer.from(await favicon.arrayBuffer());
assert.equal(faviconBytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "Favicon PNG signature");
assert.deepEqual([faviconBytes.readUInt32BE(16), faviconBytes.readUInt32BE(20)], [96, 96], "Favicon dimensions");
console.log("PASS legacy favicon redirects and stable PNG");

const sitemap = await get("/sitemap.xml");
assert.equal(sitemap.response.status, 200);
const xml = new JSDOM(sitemap.text, { contentType: "text/xml" }).window.document;
const urls = [...xml.querySelectorAll("loc")].map(loc => loc.textContent);
assert.ok(urls.length >= 9);
assert.ok(urls.every(url => url.startsWith(`${canonicalOrigin}/`)));
assert.ok(urls.includes(`${canonicalOrigin}/leaderboard`), "Leaderboard included in sitemap");
const robots = await get("/robots.txt");
assert.equal(robots.response.status, 200);
assert.match(robots.text, /^Allow: \/api\/og\/$/m, "Startup preview images are crawlable");
assert.match(robots.text, /^Disallow: \/api\/$/m, "Other API routes stay excluded from crawling");
assert.ok(robots.text.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`));
const llms = await get("/llms.txt");
assert.equal(llms.response.status, 200);
assert.ok(!llms.text.includes("https://anshkosh.com/"));
assert.ok(llms.text.includes("https://www.anshkosh.com/leaderboard"), "Leaderboard included in public guide");
const image = await fetch(new URL("/images/hero-pomegranate-v2.webp", origin));
assert.equal(image.status, 200);
assert.ok(image.headers.get("content-type")?.startsWith("image/"));
for (const path of ["/login", "/register", "/search"]) {
  const { document } = await get(path);
  assert.ok([...document.querySelectorAll('meta[name="robots"]')].some(meta => meta.content.includes("noindex")), `${path}: exclusion retained`);
  assert.ok(!document.querySelector('meta[property="og:description"]')?.content.includes("before backing opens"), `${path}: current pilot social description`);
  if (path === "/search") {
    assert.equal(document.querySelector('meta[property="og:url"]')?.content, `${canonicalOrigin}/search`, "Search social URL");
    assert.equal(document.querySelector('meta[property="og:title"]')?.content, "Search | Anshkosh", "Search social title");
  }
}
console.log("PASS sitemap, robots, llms.txt, image availability, and authentication/search exclusions");
