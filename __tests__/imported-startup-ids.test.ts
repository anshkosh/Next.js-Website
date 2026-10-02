import { describe, expect, it } from "vitest";
import { startupIdSchema, commentIdSchema } from "../lib/validators/id.schema";
import { updateStartupSchema, submitForReviewSchema } from "../lib/validators/startup.schema";
import { createUpdateSchema } from "../lib/validators/update.schema";
import { submitCommentSchema, replyToCommentSchema } from "../lib/validators/comment.schema";

const uuid = "6b0ef103-2a8d-4232-8cff-68cf9a8a1ea9";
const cuid = "cmu7wfiv7000bzglryqzerzjo";
describe("imported startup IDs", () => {
  it.each([uuid, cuid])("accepts %s across edit, submission, comments and founder updates", id => {
    expect(updateStartupSchema.safeParse({ id }).success).toBe(true);
    expect(submitForReviewSchema.safeParse({ id }).success).toBe(true);
    expect(createUpdateSchema.safeParse({ startupId: id, title: "Pilot update", body: "A useful pilot update." }).success).toBe(true);
    expect(submitCommentSchema.safeParse({ startupId: id, authorName: "Visitor", authorEmail: "visitor@example.test", body: "Where is the pilot?", turnstileToken: "test" }).success).toBe(true);
  });
  it.each(["", "../../other", "not-an-id", "6b0ef103-invalid-4232-8cff-68cf9a8a1ea9", "<script>"])("rejects malformed IDs: %s", id => {
    expect(startupIdSchema.safeParse(id).success).toBe(false);
    expect(updateStartupSchema.safeParse({ id }).success).toBe(false);
  });
  it("supports replies to imported questions without accepting arbitrary identifiers", () => {
    expect(replyToCommentSchema.safeParse({ commentId: `supabase-question-${uuid}`, reply: "We are launching soon." }).success).toBe(true);
    expect(commentIdSchema.safeParse(cuid).success).toBe(true);
    expect(commentIdSchema.safeParse("supabase-question-whatever").success).toBe(false);
  });
});
