import type { Prisma, Startup } from "@prisma/client";

export function publicStartupCardSelect(cookieId?: string) {
  return {
    id: true, slug: true, name: true, tagline: true, logoUrl: true, problemStatement: true,
    upvoteCount: true, downvoteCount: true, updateCount: true, metadata: true,
    updates: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 1, select: { title: true, createdAt: true } },
    category: { select: { name: true, iconName: true } },
    upvotes: cookieId ? { where: { cookieId }, select: { id: true } } : false,
    downvotes: cookieId ? { where: { cookieId }, select: { id: true } } : false,
  } as const satisfies Prisma.StartupSelect;
}

type CardRow = Pick<Startup, "id" | "slug" | "name" | "tagline" | "logoUrl" | "upvoteCount" | "downvoteCount" | "updateCount" | "metadata"> & {
  problemStatement?: string | null;
  category: { name: string; iconName: string | null };
  updates?: { title: string; createdAt: Date }[];
  upvotes?: { id: string }[]; downvotes?: { id: string }[];
};

// Formatted on the server in India time, so the client renders the same text.
const updateDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

export function publicStartupCard({ upvotes, downvotes, metadata, updates, ...displayFields }: CardRow) {
  const latest = updates?.[0];
  const data = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {};
  return {
    id: displayFields.id, slug: displayFields.slug, name: displayFields.name,
    tagline: displayFields.tagline, logoUrl: displayFields.logoUrl,
    problemStatement: displayFields.problemStatement?.trim() || null,
    latestUpdate: latest ? { title: latest.title, date: updateDate.format(latest.createdAt) } : null,
    category: displayFields.category, updateCount: displayFields.updateCount,
    upvoteCount: displayFields.upvoteCount, downvoteCount: displayFields.downvoteCount,
    metadata: {
      city: typeof data.city === "string" ? data.city : undefined,
      foundedYear: typeof data.foundedYear === "number" || typeof data.foundedYear === "string" ? data.foundedYear : undefined,
    },
    hasUpvoted: Boolean(upvotes?.length), hasDownvoted: Boolean(downvotes?.length),
  };
}
