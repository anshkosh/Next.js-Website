import { notFound } from "next/navigation";
import { getCommentForManagement } from "@/app/actions/comment.actions";
import CommentManagementForm from "@/components/startup/CommentManagementForm";

export const metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" as const };

export default async function ManageCommentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const comment = await getCommentForManagement(token);
  if (!comment) notFound();
  return <CommentManagementForm token={token} initial={comment} />;
}
