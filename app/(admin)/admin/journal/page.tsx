import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ExternalLink, Clock, Star } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import JournalAdminActions from "./JournalAdminActions";
import JournalCategorySelect from "./JournalCategorySelect";
import { calculateReadingTime } from "@/lib/journal-reading-time.mjs";

export const metadata = { title: "Journal — Admin" };

export default async function AdminJournalPage(props: {
  searchParams: Promise<{ q?: string; status?: string; categoryId?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/admin/dashboard");

  const q = searchParams.q ?? "";
  const status = searchParams.status ?? "";
  const categoryId = searchParams.categoryId ?? "";
  const page = parseInt(searchParams.page ?? "1");
  const take = 20;
  const skip = (page - 1) * take;

  const where: Record<string, unknown> = {};
  if (q) where.title = { contains: q, mode: "insensitive" };
  if (status === "SCHEDULED") {
    where.status = "DRAFT";
    where.scheduledAt = { not: null };
  } else if (status === "DRAFT") {
    where.status = "DRAFT";
    where.scheduledAt = null;
  } else if (status === "PUBLISHED") {
    where.status = "PUBLISHED";
  }
  if (categoryId) where.categoryId = categoryId;

  const [posts, totalCount, categories] = await Promise.all([
    db.journalPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: { category: { select: { name: true } } },
    }),
    db.journalPost.count({ where }),
    db.journalCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const totalPages = Math.ceil(totalCount / take);

  const getStatusBadge = (status: string) => {
    if (status === "SCHEDULED") return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">SCHEDULED</span>;
    if (status === "PUBLISHED") {
      return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">PUBLISHED</span>;
    }
    return <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-semibold">DRAFT</span>;
  };

  const buildQuery = (overrides: Record<string, string>) => {
    const params = new URLSearchParams({ q, status, categoryId, page: String(page), ...overrides });
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-heading">Journal</h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalCount} post{totalCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/journal/categories" className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700">
            Categories
          </Link>
          <Link href="/admin/journal/new" className="flex items-center gap-1.5 px-4 py-2 bg-coral-500 text-white rounded-md text-sm font-medium hover:bg-coral-600 transition-colors">
            <Plus size={16} /> New Post
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form method="get" className="flex-1 min-w-[200px] max-w-xs">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search posts…"
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/40"
          />
        </form>
        <div className="flex gap-1.5">
          {(["", "DRAFT", "PUBLISHED", "SCHEDULED"] as const).map(s => (
            <Link
              key={s}
              href={buildQuery({ status: s, page: "1" })}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${status === s
                ? "bg-coral-500 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s === "" ? "All" : s}
            </Link>
          ))}
        </div>
        {categories.length > 0 && (
          <JournalCategorySelect categories={categories} />
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Author</TableHead>
              <TableHead><Clock size={14} className="inline" /> Read</TableHead>
              <TableHead><Star size={14} className="inline" /></TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                  No posts found.{" "}
                  <Link href="/admin/journal/new" className="text-coral-500 hover:underline">Create the first one →</Link>
                </TableCell>
              </TableRow>
            ) : (
              posts.map(post => {
                const displayStatus = post.status === "DRAFT" && post.scheduledAt ? "SCHEDULED" : post.status;
                return (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-[260px]">
                    <span className="line-clamp-2">{post.title}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-500">{post.category?.name ?? "—"}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(displayStatus)}</TableCell>
                  <TableCell className="text-sm text-gray-600">{post.authorName}</TableCell>
                  <TableCell className="text-sm text-gray-500">{calculateReadingTime(post.contentHtml)}m</TableCell>
                  <TableCell>
                    {post.isFeatured && <Star size={14} className="text-amber-400 fill-amber-400" />}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {displayStatus === "SCHEDULED" && post.scheduledAt ? `${post.scheduledAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} IST` : (post.publishedAt ?? post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1.5">
                      {post.status === "PUBLISHED" && (
                        <a href={`/journal/${post.slug}`} target="_blank" rel="noreferrer"
                          className="p-1.5 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-md" title="View public post">
                          <ExternalLink size={15} />
                        </a>
                      )}
                      <Link href={`/admin/journal/${post.id}/edit`}
                        className="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">
                        Edit
                      </Link>
                      <JournalAdminActions postId={post.id} status={displayStatus} />
                    </div>
                  </TableCell>
                </TableRow>
              ); })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Link
              key={i}
              href={buildQuery({ page: String(i + 1) })}
              className={`px-3 py-1 rounded-md text-sm font-medium ${page === i + 1 ? "bg-coral-500 text-white" : "bg-white border text-gray-700 hover:bg-gray-50"}`}
            >
              {i + 1}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
