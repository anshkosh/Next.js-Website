import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

// Read-only HTTP smoke check. Run against a local/preview build before publishing.
const origin = process.argv[2] || "http://localhost:3011";
const canonicalOrigin = process.argv[3] || "https://www.anshkosh.com";
const publicPaths = ["/", "/discover", "/categories", "/journal", "/faq", "/about", "/contact", "/privacy", "/terms", "/trust-safety"];

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
  if (path === "/faq") {
    assert.equal(document.querySelectorAll('[data-slot="accordion-content"]').length, 15, "FAQ answers are server-rendered");
    assert.equal(document.querySelectorAll('h2 [data-slot="accordion-trigger"]').length, 15, "FAQ heading hierarchy");
  }
  console.log(`PASS ${path}: status, canonical, metadata, H1, social image`);
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

const sitemap = await get("/sitemap.xml");
assert.equal(sitemap.response.status, 200);
const xml = new JSDOM(sitemap.text, { contentType: "text/xml" }).window.document;
const urls = [...xml.querySelectorAll("loc")].map(loc => loc.textContent);
assert.ok(urls.length >= 9);
assert.ok(urls.every(url => url.startsWith(`${canonicalOrigin}/`)));
const robots = await get("/robots.txt");
assert.equal(robots.response.status, 200);
assert.ok(robots.text.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`));
const llms = await get("/llms.txt");
assert.equal(llms.response.status, 200);
assert.ok(!llms.text.includes("https://anshkosh.com/"));
const image = await fetch(new URL("/images/hero-pomegranate-v2.webp", origin));
assert.equal(image.status, 200);
assert.ok(image.headers.get("content-type")?.startsWith("image/"));
for (const path of ["/login", "/register", "/search"]) {
  const { document } = await get(path);
  assert.ok([...document.querySelectorAll('meta[name="robots"]')].some(meta => meta.content.includes("noindex")), `${path}: exclusion retained`);
}
console.log("PASS sitemap, robots, llms.txt, image availability, and authentication/search exclusions");
