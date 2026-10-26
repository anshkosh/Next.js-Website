import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, iconName: true }
    });
    // Reference labels only: never include startup counts or viewer state here.
    return NextResponse.json(categories, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
