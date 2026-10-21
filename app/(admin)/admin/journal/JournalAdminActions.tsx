"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { publishJournalPost, unpublishJournalPost, deleteJournalPost } from "@/app/actions/journal.actions";

interface JournalAdminActionsProps {
  postId: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
}

export default function JournalAdminActions({ postId, status }: JournalAdminActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handlePublish = () => {
    startTransition(async () => {
      await publishJournalPost(postId);
    });
  };

  const handleUnpublish = () => {
    startTransition(async () => {
      await unpublishJournalPost(postId);
    });
  };

  const handleDelete = () => {
    if (!confirm("Permanently delete this post?")) return;
    startTransition(async () => {
      await deleteJournalPost(postId);
    });
  };

  if (isPending) {
    return <Loader2 size={16} className="animate-spin text-gray-500" />;
  }

  return (
    <div className="flex items-center gap-1">
      {status === "DRAFT" ? (
        <button
          onClick={handlePublish}
          className="px-3 py-1 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded-md transition-colors border border-green-200"
        >
          Publish
        </button>
      ) : (
        <button
          onClick={handleUnpublish}
          className="px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md transition-colors border border-amber-200"
        >
          {status === "SCHEDULED" ? "Cancel schedule" : "Unpublish"}
        </button>
      )}
      <button
        onClick={handleDelete}
        className="px-2 py-1 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors border border-red-200"
      >
        Del
      </button>
    </div>
  );
}
