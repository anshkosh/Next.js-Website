import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields, twoFactorClient } from "better-auth/client/plugins";
import type { auth } from "./auth";

export const ADMIN_TWO_FACTOR_PATH = "/admin/login/verify";

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    // /login and /admin/login send a password sign-in that needs a code to ADMIN_TWO_FACTOR_PATH.
    twoFactorClient(),
    inferAdditionalFields<typeof auth>()
  ]
});
