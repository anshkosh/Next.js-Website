import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { calculateReadingTime } from "../../lib/journal-reading-time.mjs";

const escapeHtml = value => value.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const editorialFields = ["title", "excerpt", "contentHtml", "contentJson", "metaTitle", "metaDescription"];

export function editorialContent(post) {
  return Object.fromEntries(editorialFields.map(field => [field, post[field] ?? null]));
}

export function editorialHash(post) {
  return createHash("sha256").update(JSON.stringify(canonicalJson(editorialContent(post)))).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalJson(value[key])]));
  return value;
}

export function convertJournalPost(source, post) {
  assert.match(post.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  for (const key of ["title", "category", "excerpt", "lede"]) assert.ok(typeof post[key] === "string" && post[key].trim(), `Missing ${key}`);
  const date = post.date.match(/^(\d{1,2}) (\w+) (\d{4})$/);
  assert.ok(date && months.includes(date[2]), "Invalid publication date");
  const isoDate = `${date[3]}-${String(months.indexOf(date[2]) + 1).padStart(2, "0")}-${date[1].padStart(2, "0")}`;
  // Noon UTC preserves the source calendar date in India and on the VPS.
  const publishedAt = new Date(`${isoDate}T12:00:00Z`);
  assert.ok(Number.isFinite(publishedAt.getTime()) && publishedAt < new Date(), "Invalid publication date");
  assert.ok(post.sections.length > 0, "Missing article sections");
  const html = [];
  const ops = [];
  function paragraph(text) {
    html.push(`<p>${escapeHtml(text)}</p>`);
    ops.push({ insert: text + "\n" });
  }
  function heading(text) {
    html.push(`<h2>${escapeHtml(text)}</h2>`);
    ops.push({ insert: text }, { insert: "\n", attributes: { header: 2 } });
  }
  paragraph(post.lede);
  if (post.showPilotNotice) paragraph(source.pilotNotice);
  if (post.category === "Campaign Notes") paragraph(source.campaignNote);
  for (const section of post.sections) {
    heading(section.heading);
    assert.ok(section.paragraphs.length > 0, "Missing section paragraphs");
    section.paragraphs.forEach(paragraph);
  }
  if (post.sources?.length) {
    heading("Sources");
    html.push("<ul>");
    for (const link of post.sources) {
      assert.equal(new URL(link.url).protocol, "https:", "Invalid source link");
      html.push(`<li><a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a></li>`);
      ops.push({ insert: link.label, attributes: { link: link.url } }, { insert: "\n", attributes: { list: "bullet" } });
    }
    html.push("</ul>");
  }
  return {
    title: post.title, slug: post.slug, excerpt: post.excerpt,
    authorName: source.authorName, contentHtml: html.join("\n"), contentJson: { ops },
    status: "PUBLISHED", publishedAt, tags: [], metaKeywords: [],
    readingTimeMinutes: calculateReadingTime(html.join("\n")),
    metaTitle: post.title, metaDescription: post.excerpt,
  };
}
