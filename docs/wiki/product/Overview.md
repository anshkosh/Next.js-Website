# Product overview

## What Anshkosh is

A public home for Indian startup profiles and community discussions. Visitors explore startups at different stages, review the ideas and evidence founders share, and use free Launch Support tools. The home-page promise is "Explore Indian startups. See what founders are building."

Principles that run through the product and its copy:
- **Evidence over claims.** Founders should explain their methods, measurements and limitations. Publication review does not independently verify every claim.
- **Progress, not press releases.** Founders post public updates, including what did not work.
- **Honest limits.** Community votes reflect opinion, not verified demand, revenue or product-market fit. Leaderboard signals combine all-time net votes with capped points for founder publishing activity, approved community participants, and participants with founder replies; they measure participation, not verified traction.

## Pilot rules (current)

The site is an **early-access pilot**. These are product and legal constraints, not just wording:
- Visitors can give feedback, join waitlists and express interest.
- **Payments and preorders are not open during the pilot. Investments are not offered.** A profile, vote or expression of interest creates no financial obligation or order entitlement.
- Validation is not investing: no securities, ownership, dividends, interest, loans or returns.
- A positive validation result does not prove product-market fit.

Any feature that takes money, creates an obligation or implies a financial return needs an explicit owner decision and legal review first. Payment integration is deliberately deferred.

## Who uses it

| Audience | What they do |
|---|---|
| Visitors | Browse Discover, categories and the leaderboard, read the journal, upvote or downvote, comment and express interest |
| Founders | Register (Google or email; a verified email is required), submit startups, post updates, use the free Launch Support toolkit |
| Reviewers | Moderate startups and comments, manage categories |
| Admins | Everything reviewers do, plus settings, featured listings, the journal and admin accounts |

Roles are enforced with Better Auth's admin plugin; see [Security](../engineering/Security.md).

## Main areas of the site

- **Home**: startup discovery, founder stories and progress, listing benefits and an FAQ teaser.
- **Discover, Categories, Search**: published startups with category filtering and search, including public founder names.
- **Leaderboard**: all-time signals; tied startups share a rank, and ranks are dense (the next rank follows without gaps).
- **Startup profile** (`/startups/[slug]`): the proposition (problem, solution, audience, prototype status, traction evidence), gallery, pitch-deck download, updates and discussion.
- **Launch Support** (`/launch-support/*`): a free founder toolkit with a validation planner, MVP planner, pitch builder, runway calculator, launch card, checklist, tracker and directory list. Drafts stay in the visitor's browser.
- **Journal** (`/journal`): articles on regional ecosystems, founder playbooks and startup models, written in the admin panel. Reading times are calculated from the current body.
- **Policy pages**: FAQ, Privacy, Terms, Trust & Safety. Policy pages carry an effective date; update it when the terms change.

## Pilot banner and entry curtain

The early-access status banner and one-time entry curtain (`components/site/`) appear only on the homepage. They explain what visitors can do in the pilot and that payments and preorders are not open. Internal pages open directly.
