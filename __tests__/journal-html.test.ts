import { describe, expect, it } from "vitest";
import { sanitizeJournalHtml, serializeJsonLd, showJournalExcerpt, publicJournalHtml } from "@/lib/journal-html";
describe("journal markup boundary", () => {
  it("does not repeat an excerpt that already opens the article", () => {
    expect(showJournalExcerpt("Bluelearn raised a seed round.", "<p>Bluelearn raised a seed round. It later closed.</p>")).toBe(false);
    expect(showJournalExcerpt("A separate summary.", "<p>Bluelearn raised a seed round.</p>")).toBe(true);
    expect(showJournalExcerpt(null, "<p>Article</p>")).toBe(false);
  });
  it("preserves and orders citation links and provides safe full-size image access", () => {
    const html = publicJournalHtml('<p>Evidence<sup><a href="https://source.example/three">[3]</a> <a href="https://source.example/two">[2]</a></sup></p><img src="/api/uploads/serve/journal/exhibit.webp" onerror="alert(1)">');
    const element = document.createElement("div"); element.innerHTML = html;
    expect(element.querySelector("sup")?.textContent).toBe("[2] [3]");
    const fullSize = element.querySelector('a[href="/api/uploads/serve/journal/exhibit.webp"]');
    expect(fullSize?.textContent).toBe("Open full-size image");
    expect(fullSize?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(element.querySelector("[onerror]")).toBeNull();
  });
  it.each([
    '<script>alert(1)</script><p onclick="alert(1)">Hello</p>',
    '<svg><a href="javascript:alert(1)">x</a></svg>',
    '<img src="x" onerror="alert(1)"><iframe srcdoc="<script>alert(1)</script>"></iframe>',
    '<a href="jav&#x61;script:alert(1)">x</a><a href="//evil.test">x</a>',
    '<math><mtext><img src=x onerror=alert(1)></mtext></math>',
    '<p style="background:url(file:///etc/passwd)">hello</p><object data="https://evil.test"></object>',
  ])("removes active markup and unsafe destinations", value => {
    const element = document.createElement("div"); element.innerHTML = sanitizeJournalHtml(value);
    expect(element.querySelector("script,svg,math,iframe,object,style")).toBeNull();
    for (const child of element.querySelectorAll("*")) for (const attr of child.attributes) {
      expect(attr.name).not.toMatch(/^on|^style$/i); expect(attr.value).not.toMatch(/^javascript:|^\/\//i);
    }
  });
  it("preserves normal article formatting, owned images and HTTPS links", () => {
    const clean = sanitizeJournalHtml('<h2>Progress</h2><p class="ql-align-center"><strong>Shipped</strong></p><img src="/api/uploads/serve/journal/test.webp" alt="Product"><a href="https://example.test" target="_blank">Details</a>');
    expect(clean).toContain('<h2>Progress</h2>'); expect(clean).toContain('ql-align-center'); expect(clean).toContain('/api/uploads/serve/journal/test.webp'); expect(clean).toContain('rel="noopener noreferrer"');
  });
  it("cannot close JSON-LD with article metadata", () => {
    const value = { headline: '</script><script id="breakout">alert(1)</script>' };
    const html = `<script type="application/ld+json">${serializeJsonLd(value)}</script>`;
    const element = document.createElement("div"); element.innerHTML = html;
    expect(element.querySelectorAll("script")).toHaveLength(1);
    expect(JSON.parse(element.querySelector("script")!.textContent!)).toEqual(value);
  });
});
