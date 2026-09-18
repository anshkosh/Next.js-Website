import { NextRequest, NextResponse } from "next/server";
import { r2 } from "@/lib/storage/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const key = resolvedParams.path.join("/");

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    const response = await r2.send(command);
    if (!response.Body) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const byteArray = await response.Body.transformToByteArray();
    return new NextResponse(Buffer.from(byteArray), {
      headers: {
        "Content-Type": response.ContentType || "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving R2 object:", error);
    return new NextResponse("Not Found", { status: 404 });
  }
}
