# Startup lifecycle

## Statuses

`StartupStatus` in `prisma/schema.prisma`:

| Status | Meaning | Public? |
|---|---|---|
| `DRAFT` | The founder is still editing | No |
| `PENDING_REVIEW` | Submitted and waiting for a reviewer | No |
| `LIVE` | Approved and listed | Yes |
| `REJECTED` | Not approved; the founder sees the reason | No |
| `SUSPENDED` | Taken down after going live | No |

Only `LIVE` startups appear in Discover, categories, search, the sitemap and category counts.

## Flow

1. **Apply.** A founder with a verified account creates a startup at `/startup/new`: name, tagline, description, website, category, co-founders, proposition fields and media (logo, gallery, optional PDF pitch deck).
2. **Submit for review.** The status moves to `PENDING_REVIEW` and a `new_submission` notification job emails the admin team.
3. **Review.** Reviewers and admins work from `/admin/moderation`. They review the submitted profile and approve or reject with notes (`adminNotes`, `reviewedBy`, `reviewedAt`). Publication is not identity certification or independent verification of every claim. Founders remain responsible for the accuracy of their profile and evidence.
4. **Outcome email.** `startup_approved` or `startup_rejected` is queued to the founder.
5. **Live.** `publishedAt` is set and the profile becomes public and indexable.
6. **Ongoing.** Founders post updates (`StartupUpdate`). Visitors can upvote or downvote; [Voting](../engineering/Voting.md) describes net signals and count reconciliation. Comments go through moderation (`CommentStatus`).
7. **Slug changes.** Old URLs keep working through `SlugRedirect`.

## Featured listings

Admins choose featured startups at `/admin/featured` (`FeaturedStartup`); they appear on the home page.

## Uploads on a startup

| Upload | Route | Handling |
|---|---|---|
| Logo, gallery, founder photo, update images | `app/api/uploads/{logo,gallery,founder-photo,update-image}` | Re-encoded with `sharp` |
| Pitch deck (PDF, up to 5 MB) | `app/api/uploads/pitch-deck` | Checked and rewritten by `lib/uploads/pdf-safety.ts`; served as a download |

See [Security](../engineering/Security.md#uploads).
