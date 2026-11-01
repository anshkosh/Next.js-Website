// Render sample HTML locally. This script does not queue or send email.
import fs from "node:fs/promises";
import path from "node:path";
import { renderEmailTemplate, type TemplateName } from "../lib/email/templates";
import { renderOperationsEmail } from "../deploy/operations-email.mjs";

const samples: [TemplateName, string, Record<string, unknown>][] = [
  ["welcome", "Verify your email", { founderName: "Arush", url: "https://www.anshkosh.com/verify-email?token=preview-only" }],
  ["password_reset", "Reset your password", { userName: "Arush", url: "https://www.anshkosh.com/reset-password?token=preview-only" }],
  ["email_change", "Change your email", { userName: "Arush", newEmail: "founder@example.test", url: "https://www.anshkosh.com/confirm-email?token=preview-only" }],
  ["account_export_code", "Download account data", { code: "PREVIEW-ONLY-CODE" }],
  ["account_deletion_code", "Confirm account deletion", { code: "PREVIEW-ONLY-CODE" }],
  ["startup_approved", "Startup approved", { startupName: "Your startup" }],
  ["startup_rejected", "Startup review notes", { startupName: "Your startup", startupId: "preview", notes: "Tell visitors who you are building for and how you plan to test the idea. Then submit the updated profile for review." }],
  ["upvote_milestone", "Community milestone", { startupName: "Your startup", milestone: 10, slug: "preview" }],
  ["founder_comment_approved", "New startup comment", { startupName: "Your startup", authorName: "A visitor", commentBody: "How are you testing this with your first customers? I’d like to understand what you have learned so far.", startupId: "preview" }],
  ["newsletter_confirmation", "Newsletter confirmation", { confirmationUrl: "https://www.anshkosh.com/newsletter/confirm?token=preview-only" }],
  ["contact_inquiry", "Contact inbox", { senderName: "A founder", senderEmail: "founder@example.test", subject: "Help with my profile", message: "I have saved my startup draft. Could you help me understand what I need to complete before submitting it for review?", submittedAt: "1 November 2026, 10:00 IST" }],
  ["contact_acknowledgement", "Contact confirmation", { senderName: "Arush", subject: "Help with my profile" }],
  ["new_submission", "Admin review notification", { startupName: "Your startup", founderName: "A founder", category: "SaaS/B2B" }],
];

async function main() {
  process.env.NEXT_PUBLIC_BASE_URL = "https://www.anshkosh.com";
  const output = path.resolve(process.argv[2] || ".artifacts/email-previews");
  await fs.mkdir(output, { recursive: true });
  const pages: { file: string; label: string }[] = [];
  for (const [template, label, data] of samples) {
    const file = `${template}.html`;
    await fs.writeFile(path.join(output, file), await renderEmailTemplate(template, data));
    pages.push({ file, label });
  }
  await fs.writeFile(path.join(output, "operations.html"), renderOperationsEmail("The email worker is not online.\nCheck the current release and process manager before restarting it."));
  pages.push({ file: "operations.html", label: "Operations alert" });
  const links = pages.map(({ file, label }) => `<a href="${file}" target="email-preview">${label}</a>`).join("");
  await fs.writeFile(path.join(output, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Anshkosh email design previews</title><style>body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#111827;background:#f4f5f7}header{padding:20px 24px;border-top:4px solid #e8521e;background:#faf8f5}h1{margin:0;font-size:23px}p{font-size:13px;color:#4b5563}main{display:flex;min-height:calc(100vh - 110px)}nav{width:230px;padding:16px;flex-shrink:0;background:white}a{display:block;color:#374151;text-decoration:none;padding:12px;font-size:14px;border-radius:6px}a:hover,a:focus{background:#fff1ee;color:#a23510}iframe{border:0;width:100%;min-height:900px}a:focus-visible{outline:2px solid #c84112}@media(max-width:700px){main{display:block}nav{width:auto;display:flex;overflow:auto;padding:8px}a{white-space:nowrap}iframe{min-height:1000px}}</style></head><body><header><h1>Anshkosh email design previews</h1><p>14 email types · Preview content only; links use example values.</p></header><main><nav aria-label="Email previews">${links}</nav><iframe name="email-preview" title="Email preview" src="welcome.html"></iframe></main></body></html>`);
  console.log(`Rendered ${pages.length} previews: ${path.join(output, "index.html")}`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
