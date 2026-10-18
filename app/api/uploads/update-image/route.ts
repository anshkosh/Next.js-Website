import { type NextRequest } from "next/server";
import { imageUpload } from "@/lib/uploads/image-route";
export async function POST(req: NextRequest) { return imageUpload(req, "update-images"); }
