import { afterEach, describe, expect, it, vi } from "vitest";
import { renderEmailTemplate, type TemplateName } from "@/lib/email/templates";
import { renderOperationsEmail } from "@/deploy/operations-email.mjs";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const securityUrl = "https://www.anshkosh.com/reset-password?token=preview-only&callbackURL=%2Fdashboard";
const data = {
  founderName: "Founder", startupName: "Example startup", startupId: "example-id", slug: "example-startup",
  milestone: 10, category: "SaaS", notes: "Please describe the customer problem.",
  authorName: "A visitor", commentBody: "How are you testing this with customers?",
  senderName: "A founder", senderEmail: "founder@example.test", subject: "A question", message: "Please help with my profile.", submittedAt: "1 November 2026",
  userName: "Founder", url: securityUrl, confirmationUrl: securityUrl, newEmail: "new@example.test", code: "PREVIEW-CODE-123",
};
const templates: TemplateName[] = ["welcome", "startup_approved", "startup_rejected", "upvote_milestone", "new_submission", "contact_inquiry", "newsletter_confirmation", "founder_comment_approved", "password_reset", "email_change", "account_export_code", "account_deletion_code", "contact_acknowledgement"];
const parse = (html: string) => new DOMParser().parseFromString(html, "text/html");

afterEach(() => vi.unstubAllEnvs());

describe("branded email rendering", () => {
  it.each(templates)("includes accessible branding and working footer destinations for %s", async template => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://www.anshkosh.com");
    const html = await renderEmailTemplate(template, data);
    const document = parse(html);
    const brand = document.querySelector('img[alt="Anshkosh"]');
    expect(brand?.getAttribute("src")).toBe("https://www.anshkosh.com/email-header.png");
    expect(brand?.getAttribute("width")).toBe("600");
    expect(brand?.getAttribute("height")).toBe("100");
    expect(document.body.textContent).toContain("The Anshkosh team");
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector('a[href="mailto:hello@anshkosh.com"]')).not.toBeNull();
    expect(document.querySelector('a[href="https://www.anshkosh.com/privacy"]')).not.toBeNull();
    expect(document.querySelector('a[href="#"]')).toBeNull();
  });

  it.each(["welcome", "password_reset", "email_change", "newsletter_confirmation"] as const)("preserves the original security URL for %s", async template => {
    const document = parse(await renderEmailTemplate(template, data));
    const links = [...document.querySelectorAll("a")].map(a => a.getAttribute("href"));
    expect(links.filter(href => href === securityUrl)).toHaveLength(2);
  });

  it("escapes account names and contact subjects rather than interpreting their HTML", async () => {
    const hostile = '<img src=x onerror="alert(1)"> & text';
    for (const [template, fields] of [
      ["contact_acknowledgement", { senderName: hostile, subject: hostile }],
      ["password_reset", { userName: hostile, url: securityUrl }],
      ["contact_inquiry", { ...data, message: hostile }],
    ] as const) {
      const document = parse(await renderEmailTemplate(template, fields));
      expect(document.querySelector("[onerror]")).toBeNull();
      expect(document.body.textContent).toContain(hostile);
    }
  });

  it("keeps privacy confirmation codes and the two purposes distinct", async () => {
    const download = parse(await renderEmailTemplate("account_export_code", data)).body.textContent;
    const deletion = parse(await renderEmailTemplate("account_deletion_code", data)).body.textContent;
    expect(download).toContain(data.code);
    expect(download).toContain("15 minutes");
    expect(download).toContain("not account deletion");
    expect(deletion).toContain(data.code);
    expect(deletion).toContain("type DELETE and confirm on the website");
  });

  it("only offers notification preferences on account notification messages", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://www.anshkosh.com");
    const notification = parse(await renderEmailTemplate("founder_comment_approved", data));
    const recovery = parse(await renderEmailTemplate("password_reset", data));
    expect(notification.querySelector('a[href="https://www.anshkosh.com/settings#email-notifications"]')).not.toBeNull();
    expect(recovery.querySelector('a[href$="#email-notifications"]')).toBeNull();
  });

  it("uses the same logo in operations alerts and escapes log content", () => {
    const message = 'Worker offline\n<img src=x onerror="alert(1)"> & check';
    const document = parse(renderOperationsEmail(message));
    expect(document.querySelector('img[alt="Anshkosh"]')?.getAttribute("src")).toBe("https://www.anshkosh.com/email-header.png");
    expect(document.body.textContent).toContain("The Anshkosh team");
    expect(document.body.textContent).toContain(message);
    expect(document.querySelector("[onerror]")).toBeNull();
  });

  it("ships the website wordmark as outlined artwork with an undistorted high-resolution PNG", async () => {
    const svg = fs.readFileSync(path.resolve("public/email-brand.svg"), "utf8");
    expect(svg).toContain("Oswald 700 at 24px");
    expect(svg).not.toContain("<text");
    expect(svg).toContain('<rect width="144" height="32" rx="3" fill="#FFFFFF"/>');
    const png = await sharp(path.resolve("public/email-brand.png")).metadata();
    expect(png.format).toBe("png");
    expect(png.width).toBe(864);
    expect(png.height).toBe(192);
    expect(png.hasAlpha).toBe(true);
  });
});
