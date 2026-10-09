import type { Prisma, Startup } from "@prisma/client";

export function publicStartupCardSelect(cookieId?: string) {
  return {
    id: true, slug: true, name: true, tagline: true, logoUrl: true,
    upvoteCount: true, downvoteCount: true, updateCount: true, metadata: true,
    category: { select: { name: true, iconName: true } },
    upvotes: cookieId ? { where: { cookieId }, select: { id: true } } : false,
    downvotes: cookieId ? { where: { cookieId }, select: { id: true } } : false,
  } as const satisfies Prisma.StartupSelect;
}

type CardRow = Pick<Startup, "id" | "slug" | "name" | "tagline" | "logoUrl" | "upvoteCount" | "downvoteCount" | "updateCount" | "metadata"> & {
  category: { name: string; iconName: string | null };
  upvotes?: { id: string }[]; downvotes?: { id: string }[];
};

export function publicStartupCard({ upvotes, downvotes, metadata, ...displayFields }: CardRow) {
  const data = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {};
  return {
    id: displayFields.id, slug: displayFields.slug, name: displayFields.name,
    tagline: displayFields.tagline, logoUrl: displayFields.logoUrl,
    category: displayFields.category, updateCount: displayFields.updateCount,
    upvoteCount: displayFields.upvoteCount, downvoteCount: displayFields.downvoteCount,
    metadata: {
      city: typeof data.city === "string" ? data.city : undefined,
      foundedYear: typeof data.foundedYear === "number" || typeof data.foundedYear === "string" ? data.foundedYear : undefined,
    },
    hasUpvoted: Boolean(upvotes?.length), hasDownvoted: Boolean(downvotes?.length),
  };
}
