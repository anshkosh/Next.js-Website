# Anshkosh

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The current pilot serves Indian founders publishing startup profiles and progress, and visitors discovering startups and giving useful feedback. Founders also use the free Launch Support tools to clarify an idea and prepare their next step.

Reviewers and administrators operate the existing moderation and publishing workflows. These are supporting roles, not the primary public audience.

## Product Purpose

Help people explore Indian startups at different stages and understand the idea, team, problem, evidence, and progress behind them. Give founders a public home for their work and practical free tools to move an early idea forward.

The owner confirmed this current pilot scope on 8 October 2026. The homepage promise is “Explore Indian startups. See what founders are building.”

## Positioning

Anshkosh connects Indian startup discovery with public founder profiles, progress and feedback, alongside free founder tools. Its product emphasis is understanding the work behind an idea rather than presenting unverified claims as proven traction.

Do not invent superiority claims, guaranteed validation, fundraising outcomes, or product-market-fit results.

## Operating Context

- The public experience includes the homepage, discovery and category browsing, an all-time startup leaderboard, search, startup profiles, Journal, FAQ, Contact, and policy pages.
- The leaderboard includes only published startup profiles, ranked by all-time signals: net votes (upvotes minus downvotes) plus capped points for founder publishing activity, approved community participants, and participants with founder replies. Tied startups share a rank; ranks are dense, so the next rank follows without gaps. Startup cards, profiles and the leaderboard show the same signal total, labelled as votes plus activity. A visitor has one active vote per startup and can switch or remove it. Public founder-name search matches published founding teams. It offers profile links, voting and pagination; category and time filters are outside the owner-requested scope.
- Members and backers can register with founder mode off by default. Visitors who start at `/startup/new` keep that destination through login, registration and email verification; founder mode is preselected on that path only, with a clear option to turn it off. Members can also change founder mode from the dashboard. Switching it off hides every owned startup and its linked founder stories publicly, including direct startup links, while preserving saved work, moderation status and permissions. Switching it back on restores previous public visibility.
- Profile settings supports a photo, bio, location, website, startup-review/vote-milestone email preferences, verified email changes, password changes and other-device sign-out. Profile details do not overwrite published startup team information; optional email settings do not disable security or recovery messages.
- Founders create an account to submit a startup profile. Profiles are reviewed before publication; founders can manage profiles and updates through the existing account workflows.
- Launch Support tools work without an account. Drafts are stored in the browser on the current device, separated by signed-in account (with a separate anonymous namespace) and shared across that person’s tools; copy and download actions produce reusable materials.
- The under-construction banner and preview entry curtain communicate the early-access pilot.
- The existing implementation is Next.js App Router, React, TypeScript and Tailwind, with the repository's established authentication, database and deployment setup. This is an existing website, not a new scaffold.
- Current owner instructions and the implemented homepage take precedence over older wiki descriptions of homepage messaging or future campaign plans.

## Capabilities and Constraints

- Current owner-confirmed scope: startup profiles and progress, visitor discovery and feedback, and free founder tools.
- The founder toolkit includes customer validation planning, MVP scope planning, runway calculation, pitch building, launch graphics, reusable launch materials, a launch checklist, directory information and submission tracking.
- Account and review requirements must be explained accurately. Free support does not bypass profile review or guarantee editorial placement.
- Payments and preorders are not open during the pilot. Investments are not offered. Feedback and expressions of interest do not create a financial obligation or verify a startup's claims.
- Validation is not investment and does not establish product-market fit. Do not imply securities, ownership, returns or guaranteed traction.
- Directory acceptance, backlinks, indexing, rankings, traffic and funding are not guaranteed. Automated directory submission and backlink packages are not current offers.
- Preserve existing routes, authentication, moderation and data behavior during visual refinements unless the owner explicitly changes the scope.
- Future monetization, preorder availability and a formal accessibility conformance target remain undecided here. Do not turn possible future features into current promises.

## Brand Commitments

- The product name is **Anshkosh**. The mascot's public name is **Kosh**; use Kosh in visible copy and accessible labels rather than referring to it as “the fox.”
- Kosh belongs in error pages and relevant empty states, with brief, quirky comments and useful recovery actions. The owner moved it away from the general floating page-mascot role.
- Preserve the supplied Kosh character, texture, accessories, complete tail, transparency and stable apparent size when directions and reactions switch.
- The owner prefers the site's off-white background baseline after rejecting a sitewide cream treatment. Existing selective homepage and full error-page cream sections are deliberate exceptions; this is a preservation constraint, not a request to redesign the palette.
- Preserve the incumbent Anshkosh identity during consistency and polish work. The owner approved the existing page direction and requested tighter spacing and clearer alignment, not a rebrand.
- Use plain, helpful language. Let Kosh add personality without obscuring what happened or how to continue. Never invent endorsements, customer counts or product claims to fill a layout.

## Evidence on Hand

- The current homepage and public page copy in `components/landing/` and `app/(public)/` provide the implemented pilot messaging and workflows.
- Existing product and operational documentation is in `README.md` and `docs/wiki/`. Some homepage descriptions in older documentation predate the owner's recent updates.
- Brand assets include `public/logo.svg` and the supplied Kosh artwork. Served mascot atlases are `public/mascots/anshkosh-fox-directions.webp` and `public/mascots/anshkosh-fox-reactions.webp`; source artwork and packing notes are in `characters/anshkosh-fox/`.
- The shared error and mascot components are in `components/site/`. Their naming and size corrections reflect explicit owner feedback.
- A local UI consistency review is saved in `.codex-mascot-preview/ui-ux-consistency-audit.md`. It is diagnostic evidence, not blanket authorization to implement every recommendation. Populated listings and authenticated screens were outside that visual review's verified scope.
- Do not fabricate startup examples, testimonials, partnerships, performance data or validation results when real content is absent.

## Product Principles

1. Make the idea, team and progress easy to understand before asking for interest.
2. Prefer evidence and useful feedback over unsupported claims.
3. Give founders a practical next step while keeping free tools accessible.
4. Explain the pilot's limits and review process at the relevant decision points.
5. Preserve the established identity and product behavior when improving consistency.
