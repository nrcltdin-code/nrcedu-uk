import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, twoFactorClient } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

// The sign-in form handles the two-step code itself (it checks for twoFactorRedirect).
export const authClient = createAuthClient({ plugins: [inferAdditionalFields<typeof auth>(), twoFactorClient()] });
