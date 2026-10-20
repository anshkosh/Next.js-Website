import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// One request-scoped session lookup shared by the layout, header and discussion.
export const viewerSession = cache(async () => process.env.DATABASE_URL
  ? auth.api.getSession({ headers: await headers() }) : null);
