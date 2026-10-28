import Link from "next/link";
import { seoMetadata } from "@/lib/seo";

export const metadata = seoMetadata({
  title: "Privacy Notice — Anshkosh",
  description: "How Anshkosh handles accounts, startup profiles, beta tester requests, public comments, voting, and browser-only founder tool drafts.",
  path: "/privacy",
});

const sections = [
  { title: "Account downloads and deletion", paragraphs: [
    "Account settings offers a JSON download of your account profile, preferences, linked sign-in provider names, owned startups, journal content and upload links. File attachments are downloaded separately. Passwords, sign-in tokens, internal security or moderation records, other people's comments and beta applicants' contact details are excluded. Only records linked to your account are included; anonymous voting/comment records, beta applications to other startups and newsletter subscriptions are managed separately.",
    "Both downloading account data and deleting an account require a separate, single-use confirmation code sent to the account's current verified email address. Codes expire after 15 minutes. Opening an email does not delete an account. Deletion requires entering the code and typing DELETE in settings. Accounts with staff access need a responsibility handover through hello@anshkosh.com before closure.",
    "Confirmed deletion removes the active account, sign-in methods, sessions, owned startups and journal entries, including drafts and published content. Owned startups' beta programs and application records are also removed. Recorded uploads are blocked from new requests while object removal is queued and retried. Minimal upload identifiers remain until storage removal succeeds. Browser/device drafts, separately collected records, cached or downloaded copies held by others, and backup copies are not automatically erased by this action. Backups are managed separately and are not erased immediately; contact us about retained copies or a broader privacy request. Download any wanted data and attachments before confirming deletion.",
  ] },
  { title: "Newsletter consent and confirmation", paragraphs: [
    "Newsletter signup is optional and uses a separate, unchecked consent choice. We verify your request by an email confirmation link valid for 24 hours. A submitted address is not an active subscriber until confirmed; older unconfirmed entries are not automatically activated. We record the request time, confirmation time and consent-notice version. Security checks and network/email request limits help prevent automated signups.",
    "You can withdraw newsletter consent without an account using your unsubscribe link, or email hello@anshkosh.com. Withdrawal excludes the address from newsletter delivery. Hourly housekeeping removes expired confirmation records; withdrawn and never-confirmed subscriber records are removed after 180 days. We do not use beta tester applications as newsletter consent.",
  ] },
  { title: "Information sent to Anshkosh", paragraphs: [
    "You may optionally save a date of birth in account settings. It is private account information, is not displayed on public profiles, and can be removed by clearing the date and saving your profile. Providing it does not independently verify your age.",
    "Account registration and sign-in handle your name, email, credentials and session information. Startup submissions include the profile, founding team, links, media and contact details you provide. These records are stored on our servers for account, review and publishing workflows.",
    "Discussion forms send your display name, email and comment text for moderation. If a comment is approved, the startup founder receives an email alert with the comment’s public display name and text when approved-comment alerts are enabled in account settings; the commenter’s email stays private. Contact forms send your contact details and message. Newsletter signups send your email so we can send the updates you request. These submissions are separate from the browser-only planning tools.",
  ] },
  { title: "Beta tester requests", paragraphs: [
    "When you request to beta test a startup, Anshkosh collects your name, email address, any optional note you provide, the startup you selected, and a record of the consent notice you accepted and when. CAPTCHA and rate-limit checks may also process browser or request information to prevent abuse. Beta requests are currently limited to people aged 18 or older.",
    "The startup’s founder sees your name and optional note while reviewing your request. Your email address is kept private from the founder until they approve you; after approval, it is shown to that founder so they can contact you. It is not published on your profile or shared with other founders. The email address is entered by you and is not independently verified by Anshkosh.",
    "Anshkosh uses these details only to record and route your interest, support the founder’s review, prevent abuse, and handle privacy or support requests. The founder decides whether to accept you and is responsible for contacting approved testers and arranging product access, onboarding, support, and any reward they describe. Anshkosh does not guarantee selection, access, or a reward, and does not run the founder’s beta program.",
    "You can ask us to withdraw or delete a pending request by emailing hello@anshkosh.com with the startup name and email address used. If a founder has already approved you, contact both the founder and Anshkosh if you no longer want to take part. Declined requests have their name, email, and note removed; an approved request can be deleted by the founder or on a valid privacy request. A founder may already have copied contact details outside Anshkosh, which we cannot remove from their separate records.",
  ] },
  { title: "What becomes public", paragraphs: [
    "Published startup profiles, listed founder names and roles, public media, links and founder progress updates can be viewed by visitors and found through site search. Only the published profile is used for public discovery; pending profile revisions are not shown as published changes.",
    "When a discussion comment is approved, its display name, text and posting date become public. A published founder reply and its date are also public. Your comment email is kept private and is excluded from public discussion responses. The founder’s approval alert contains only the public display name and approved comment text, not the commenter’s email. Avoid putting private contact details or sensitive information in your display name or comment text.",
    "Public voting totals include upvotes, downvotes and net votes (upvotes minus downvotes). Leaderboard signals also include capped points for public founder publishing days, approved community participants and participants with founder replies. Comment email addresses are normalized privately to group participation per startup; legacy imported comments without email are grouped by display name. Only aggregate counts are displayed, not email addresses or visitor voting identifiers. These signals do not verify identities or a startup’s claims.",
    "Account email addresses, startup contact numbers, private pitch decks, account credentials and raw security records are not published as part of public profiles. A pitch deck marked public is accessible through its public link; choose its visibility carefully before submitting it.",
  ] },
  { title: "Automated content moderation", paragraphs: [
    "We use automated text safety checks through Cloudflare Workers AI, alongside human review, for comments, founder replies, startup updates and founder journal entries submitted for public publication. Submitted text and display names, where applicable, are sent for this check. Comment email fields, account credentials, private journal drafts and uploaded file bytes are not sent to the AI moderation service. We keep review outcomes and limited operational metadata. Automated checks can make mistakes; contact hello@anshkosh.com to ask for human reconsideration.",
  ] },
  { title: "Free founder tools and local drafts", paragraphs: [
    "Launch Support tools work without an account. Shared startup details, planning drafts, validation notes, runway inputs and submission-tracker data are saved in local browser storage on this device when storage is available. Checklist progress is also saved locally. Shared details can appear across the tools in the same browser; drafts do not automatically sync to another device or account. Signed-in accounts and signed-out visitors use separate draft keys. Signing out removes free-tool drafts from this browser; download anything you want to keep first. If cleanup is blocked, the sign-out page tells you to clear site storage before sharing the device.",
    "Using the planning tools does not send those drafts to Anshkosh or publish a startup profile. If browser storage is unavailable, some tools keep a temporary draft for the current visit and display a warning. Download any results you want to keep before leaving.",
    "The launch-card maker reads a selected logo in your browser to create the graphic. That logo is not uploaded or saved between visits. This is different from uploading media through an account’s startup submission form.",
    "Copy and download controls create materials you can save or share yourself. Use a tool’s clear or reset control where provided, or remove this site’s storage in your browser settings. Clear drafts before changing startups or sharing a device. Clearing browser drafts does not delete your account, submitted profiles or saved downloads.",
  ] },
  { title: "Cookies, votes and abuse prevention", paragraphs: [
    "A private comment-receipt cookie lets the submitting browser display comments that are awaiting review. It stores up to 20 comment identifiers for seven days, with no email address or comment text. Anyone using that browser can see its pending comments. Clearing the cookie removes that browser access without deleting the submitted comments; receipts do not sync to other devices.",
    "Session cookies support sign-in. The visitor cookie anshkosh_vid helps remember your active vote for a startup and is set for up to one year. It is not a public voter name and does not require an account. You can remove cookies through your browser settings; doing so may sign you out or remove remembered voting state.",
    "Voting and some public forms use a hash derived from the request’s IP address and browser user-agent to help limit duplicate submissions and abuse. Security checks and rate limits may also process request information. These identifiers help enforce voting controls; they are not proof that every vote comes from a unique person.",
    "Where a CAPTCHA is shown, its provider may process browser and request information to check for automated activity. Hosting, database, file storage and email services process the information needed to deliver their respective functions.",
  ] },
  { title: "How information is used", paragraphs: [
    "We use submitted information to operate accounts, review and publish startup profiles and comments, deliver requested updates, respond to messages, maintain voting totals and prevent abuse. Staff responsible for these workflows can access the records needed to carry them out.",
    "Public comments are published after approval rather than treated only as anonymous, aggregated feedback. The planning tools help you work with your own notes locally. Beta tester requests are a separate, optional feature described above; they do not create an order, payment, investment, or entitlement. Payments and preorders are not open during the pilot.",
  ] },
  { title: "Retention, access and choices", paragraphs: [
    "We keep personal information only while it is needed for the purpose described in this notice, to operate your account or requested service, to address safety or legal issues, or as otherwise permitted or required by law. Declined beta requests have their identifying details removed. Founders can remove approved request records from their dashboard; you can also contact us to request withdrawal, access, correction, or deletion. Local drafts remain in your browser until you clear them, sign out of the account, or the browser removes its storage; downloaded copies remain wherever you save them.",
    "You may contact us to exercise privacy rights available to you under applicable law, including asking about your personal information, requesting correction or erasure, withdrawing consent where consent is the basis for processing, or raising a grievance. Tell us which account or record your request concerns. We may need to verify your identity and may retain information where law requires or permits it. Removing information from Anshkosh cannot remove copies a founder or another recipient has already saved outside the platform.",
  ] },
  { title: "Do not submit sensitive material", paragraphs: [
    "Do not put passwords, financial credentials, private health information, confidential trade secrets or other highly sensitive material into public profile fields or discussions. Use only media and personal details you have permission to share. On a shared device, take care with locally saved tool drafts too.",
  ] },
];

export default function PrivacyPage() {
  return (
    <section className="min-h-screen bg-white py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <span className="mb-4 block text-xs font-semibold uppercase tracking-widest text-coral-500">Pilot privacy notice</span>
        <h1 className="mb-4 font-heading text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">Privacy Notice</h1>
        <p className="mb-8 text-sm text-gray-600">Updated: 23 October 2026 · Data fiduciary/operator: Anshkosh Pvt Ltd · Grievance contact: Hyderabad, Telangana, India · <a className="font-medium text-coral-700 underline" href="mailto:hello@anshkosh.com">hello@anshkosh.com</a></p>
        <p className="mb-8 text-base leading-relaxed text-gray-600">This notice describes personal information used for the Anshkosh startup discovery pilot, including accounts, discussions, voting, beta tester requests and free founder tools. The beta tester consent notice gives the specific details shown when you submit a tester request.</p>
        <div className="space-y-12">
          {sections.map(section => <section key={section.title} className="border-t border-gray-100 pt-8">
            <h2 className="mb-4 font-heading text-2xl font-bold text-gray-900">{section.title}</h2>
            <div className="space-y-4 text-base leading-relaxed text-gray-600">{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
          </section>)}
          <section className="border-t border-gray-100 pt-8">
            <h2 className="mb-4 font-heading text-2xl font-bold text-gray-900">Privacy requests and grievances</h2>
            <p className="text-base leading-relaxed text-gray-600">Anshkosh Pvt Ltd’s designated grievance contact is based in Hyderabad, Telangana, India and can answer questions about how your information is handled and receive requests or grievances. Email <a href="mailto:hello@anshkosh.com" className="font-semibold text-coral-700 underline underline-offset-4">hello@anshkosh.com</a> or use our <Link href="/contact" className="font-semibold text-coral-700 underline underline-offset-4">contact page</Link>. If you are writing about a beta tester request, include the startup name and the email address you used. We will respond within the period required by applicable law.</p>
            <p className="mt-4 text-base leading-relaxed text-gray-600">Read the <Link href="/beta-consent" className="font-semibold text-coral-700 underline underline-offset-4">Beta Tester Consent Notice</Link> for the specific information collected and shared for that feature.</p>
          </section>
        </div>
      </div>
    </section>
  );
}
