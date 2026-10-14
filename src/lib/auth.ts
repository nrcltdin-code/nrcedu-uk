import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { queueEmail } from "@/lib/email";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Google sign-in switches on once both keys are set in .env.
export const googleEnabled = Boolean(googleClientId && googleClientSecret);

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.APP_URL,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // "Forgot password" emails a one-hour link to /reset-password; resetting signs out other devices.
    sendResetPassword: async ({ user, url }) => {
      queueEmail({
        to: user.email,
        subject: "Reset your NRC password",
        text: `Hello ${user.name},\n\nSomeone asked to reset the password for this account. If it was you, choose a new password here (the link works for one hour):\n${url}\n\nIf it was not you, ignore this email; your password stays the same.`,
      });
    },
    revokeSessionsOnPasswordReset: true,
  },
  socialProviders: googleEnabled
    ? { google: { clientId: googleClientId!, clientSecret: googleClientSecret! } }
    : {},
  account: {
    // Lets someone who registered with a password also sign in with Google on the same email.
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  user: {
    additionalFields: {
      // input: false means a visitor cannot set these when signing up; everyone starts as a student.
      role: { type: "string", defaultValue: "STUDENT", input: false },
      status: { type: "string", defaultValue: "ACTIVE", input: false },
      phone: { type: "string", required: false },
    },
  },
  databaseHooks: {
    session: {
      create: {
        // Stops sign-in for accounts that are not active, e.g. an agent waiting for approval.
        before: async (session) => {
          const user = await db.user.findUnique({ where: { id: session.userId }, select: { status: true } });
          if (user?.status === "PENDING") {
            throw new APIError("FORBIDDEN", { message: "Your account is waiting for approval. We will email you once it is active." });
          }
          if (user?.status === "SUSPENDED") {
            throw new APIError("FORBIDDEN", { message: "This account has been suspended. Please contact us." });
          }
        },
      },
    },
  },
  // Keep last: lets server actions set the session cookie.
  plugins: [nextCookies()],
});
