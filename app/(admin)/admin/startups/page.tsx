import { db } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { suspendStartup, unsuspendStartup } from "@/app/actions/admin.actions";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, ShieldOff, ShieldAlert, ShieldCheck } from "lucide-react";
import StartupsClientFilters from "./StartupsClientFilters";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function AdminStartupsPage(props: {
  searchParams: Promise<{ q?: string; status?: string; categoryId?: string; sort?: string; page?: string }>
}) {
  const searchParams = await props.searchParams;
  const q = searchParams.q || "";
  const status = searchParams.status || "";
  const categoryId = searchParams.categoryId || "";
  const sort = searchParams.sort || "date_desc";
  const page = parseInt(searchParams.page || "1");
  const take = 20;
  const skip = (page - 1) * take;

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isAdmin = session?.user.role === "admin";

  const where: any = {};
  if (q) {
    where.name = { contains: q, mode: "insensitive" };
  }
  if (status) {
    where.status = status;
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }

  let orderBy: any = {};
  switch (sort) {
    case "name_asc": orderBy = { name: "asc" }; break;
    case "name_desc": orderBy = { name: "desc" }; break;
    case "upvotes_desc": orderBy = { upvoteCount: "desc" }; break;
    case "upvotes_asc": orderBy = { upvoteCount: "asc" }; break;
    case "date_asc": orderBy = { createdAt: "asc" }; break;
    case "date_desc": default: orderBy = { createdAt: "desc" }; break;
  }

  const [startups, totalCount, categories] = await Promise.all([
    db.startup.findMany({
      where,
      orderBy,
      take,
      skip,
      include: { category: true, founder: { select: { name: true } } },
    }),
    db.startup.count({ where }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
  ]);

  const totalPages = Math.ceil(totalCount / take);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">DRAFT</span>;
      case "PENDING_REVIEW": return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">PENDING</span>;
      case "LIVE": return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">LIVE</span>;
      case "REJECTED": return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">REJECTED</span>;
      case "SUSPENDED": return <span className="bg-red-900 text-white px-2 py-1 rounded-full text-xs font-semibold">SUSPENDED</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-heading">Startups</h1>
        <span className="text-sm text-gray-500">{totalCount} startups found</span>
      </div>

      <StartupsClientFilters categories={categories} />

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Logo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Upvotes</TableHead>
              <TableHead>Founder</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {startups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No startups found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              startups.map(startup => (
                <TableRow key={startup.id}>
                  <TableCell>
                    {startup.logoUrl ? (
                      <div className="w-8 h-8 rounded-md bg-gray-100 flex overflow-hidden">
                        <Image src={startup.logoUrl} alt={startup.name} width={32} height={32} className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                        {startup.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/startups/${startup.slug}`} className="hover:underline">
                      {startup.name}
                    </Link>
                  </TableCell>
                  <TableCell>{startup.category.name}</TableCell>
                  <TableCell>{getStatusBadge(startup.status)}</TableCell>
                  <TableCell>{startup.upvoteCount}</TableCell>
                  <TableCell>{startup.founder?.name || "Unknown"}</TableCell>
                  <TableCell>{startup.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <a href={`/startups/${startup.slug}`} target="_blank" rel="noreferrer" className="p-1.5 text-gray-500 hover:text-gray-900 bg-gray-100 rounded" title="View Public Page">
                        <ExternalLink size={16} />
                      </a>
                      {isAdmin && startup.status !== "SUSPENDED" && (
                        <form action={async () => {
                          "use server";
                          await suspendStartup(startup.id);
                        }}>
                          <button type="submit" className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 rounded" title="Suspend Startup">
                            <ShieldAlert size={16} />
                          </button>
                        </form>
                      )}
                      {isAdmin && startup.status === "SUSPENDED" && (
                        <form action={async () => {
                          "use server";
                          await unsuspendStartup(startup.id);
                        }}>
                          <button type="submit" className="p-1.5 text-green-600 hover:text-green-700 bg-green-50 rounded" title="Unsuspend Startup">
                            <ShieldCheck size={16} />
                          </button>
                        </form>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Link 
              key={i} 
              href={`?q=${q}&status=${status}&categoryId=${categoryId}&sort=${sort}&page=${i + 1}`}
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
