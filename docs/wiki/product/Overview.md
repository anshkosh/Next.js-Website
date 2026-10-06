# Product overview

## What Anshkosh is

A public validation platform for startups, with an optional reward-crowdfunding path later. Founders test a solution, publish evidence and risks, collect structured public signals, and share what they learn before deciding whether to launch a campaign. The home-page promise is "Back the next thing before it launches."

Principles that run through the product and its copy:
- **Evidence over claims.** Every founder claim should come with its method, measurement and limitations. The home page contrasts "what founders claim" with "what the platform records".
- **Progress, not press releases.** Founders post public updates, including what did not work.
- **No unverified traction.** A validation signal states what was tested, how, and what remains uncertain.

## Pilot rules (current)

The site is an **early-access pilot**. These are product and legal constraints, not just wording:
- Visitors can give feedback, join waitlists and express interest.
- **No payments, backing, reward orders, pledges or investments are open.** Joining a list or giving feedback creates no pledge, purchase, investment or promise.
- Validation is not investing: no securities, ownership, dividends, interest, loans or returns.
- A positive validation result does not prove product-market fit.

Any feature that takes money, creates an obligation or implies a financial return needs an explicit owner decision and legal review first. Payment integration is deliberately deferred.

## Who uses it

| Audience | What they do |
|---|---|
| Visitors and backers | Browse Discover and categories, read the journal, upvote, comment, join waitlists |
| Founders | Register (Google or email; a verified email is required), submit startups, post updates, use the free Launch Support toolkit |
| Reviewers | Moderate startups and comments, manage categories |
| Admins | Everything reviewers do, plus settings, featured listings, the journal and admin accounts |

Roles are enforced with Better Auth's admin plugin; see [Security](../engineering/Security.md).

## Main areas of the site

- **Home**: the pitch, the founder/backer split, sample founder cards, the validation process (Apply → Review → Validate → Launch), the pilot engagement model and an FAQ teaser.
- **Discover, Categories, Search**: live startups with a category filter and full-text search.
- **Startup profile** (`/startups/[slug]`): the proposition (problem, solution, audience, prototype status, traction evidence), gallery, pitch-deck download, updates and discussion.
- **Launch Support** (`/launch-support/*`): a free founder toolkit with a validation planner, MVP planner, pitch builder, runway calculator, launch card, checklist, tracker and directory list. Drafts stay in the visitor's browser.
- **Journal** (`/journal`): articles on regional ecosystems, founder playbooks and campaign notes, written in the admin panel.
- **Policy pages**: FAQ, Privacy, Terms, Trust & Safety. Policy pages carry an effective date; update it when the terms change.

## Pilot banner and entry curtain

A sitewide "under construction" banner and a one-time "Sneak peek" entry curtain (`components/site/`) signal the pilot. They are intentional; remove or change them deliberately when the pilot ends.
