import { NextResponse } from "next/server";
import { getFounders } from "@/app/actions/founder.actions";

export const dynamic = "force-dynamic";

// A team read must not commit an action response over a newer wizard step.
// Keep the same public/owner/reviewer checks as every other team read.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getFounders((await params).id);
  return NextResponse.json(result, {
    status: result.error ? 400 : 200,
    headers: { "Cache-Control": "private, no-store" },
  });
}
