import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, ShieldAlert, TrendingUp, Users, BarChart3, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  // 1 & 2. Total Startups and Status Breakdown
  const statusCounts = await db.startup.groupBy({
    by: ["status"],
    _count: true,
  });

  const totalStartups = statusCounts.reduce((acc, curr) => acc + curr._count, 0);
  
  const statusMap = statusCounts.reduce((acc, curr) => {
    acc[curr.status] = curr._count;
    return acc;
  }, {} as Record<string, number>);

  const pendingReviewCount = statusMap["PENDING_REVIEW"] || 0;

  // 4. Total Upvotes Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upvotesToday = await db.upvote.count({
    where: {
      createdAt: {
        gte: today,
      },
    },
  });

  // 5. New Founders This Week
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const newFoundersCount = await db.user.count({
    where: {
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
  });

  // 6. Top 5 Startups by Upvotes
  const topStartups = await db.startup.findMany({
    orderBy: { upvoteCount: "desc" },
    take: 5,
    select: { id: true, name: true, upvoteCount: true, status: true },
  });

  // 7. Startups Per Category
  const categories = await db.category.findMany({
    include: {
      _count: {
        select: { startups: true },
      },
    },
    orderBy: {
      startups: { _count: "desc" }
    }
  });

  const maxCategoryCount = Math.max(...categories.map(c => c._count.startups), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-heading mb-6">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Total Startups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Startups</CardTitle>
            <Rocket className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalStartups}</div>
          </CardContent>
        </Card>

        {/* Pending Reviews */}
        <Card className={pendingReviewCount > 0 ? "border-coral-500 border-2" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Reviews</CardTitle>
            <AlertCircle className={`h-4 w-4 ${pendingReviewCount > 0 ? "text-coral-500" : "text-gray-500"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{pendingReviewCount}</div>
            <Link href="/admin/moderation" className="text-sm text-coral-500 hover:underline font-medium">
              View moderation queue →
            </Link>
          </CardContent>
        </Card>

        {/* Upvotes Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Upvotes Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upvotesToday}</div>
          </CardContent>
        </Card>

        {/* New Founders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">New Users (7 days)</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{newFoundersCount}</div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Startups by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg min-w-24">
                <span className="text-sm text-gray-500 mb-1">DRAFT</span>
                <span className="text-xl font-bold">{statusMap["DRAFT"] || 0}</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg min-w-24">
                <span className="text-sm text-yellow-600 mb-1">PENDING</span>
                <span className="text-xl font-bold">{statusMap["PENDING_REVIEW"] || 0}</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg min-w-24">
                <span className="text-sm text-green-600 mb-1">LIVE</span>
                <span className="text-xl font-bold">{statusMap["LIVE"] || 0}</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-red-50 rounded-lg min-w-24">
                <span className="text-sm text-red-600 mb-1">REJECTED</span>
                <span className="text-xl font-bold">{statusMap["REJECTED"] || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Startups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Top 5 Startups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topStartups.length > 0 ? topStartups.map((startup, idx) => (
                <div key={startup.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-medium w-4">{idx + 1}.</span>
                    <span className="font-medium truncate max-w-48">{startup.name}</span>
                    {startup.status !== "LIVE" && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">{startup.status}</span>
                    )}
                  </div>
                  <div className="font-medium text-coral-500">{startup.upvoteCount}</div>
                </div>
              )) : (
                <p className="text-sm text-gray-500">No startups yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Categories Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Startups per Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.slice(0, 6).map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{cat.iconName} {cat.name}</span>
                    <span className="text-gray-500 font-medium">{cat._count.startups}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-coral-400 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${(cat._count.startups / maxCategoryCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
