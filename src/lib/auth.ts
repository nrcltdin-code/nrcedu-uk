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
  // New registrations get a link to confirm their address; the dashboard shows a reminder with
  // "Send again" until they do. Signing in does not depend on it.
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      queueEmail({
        to: user.email,
        subject: "Confirm your email address",
        text: `Hello ${user.name},\n\nPlease confirm this is your email address so we can keep you updated about your applications:\n${url}\n\nIf you did not create an NRC account, ignore this email.`,
      });
    },
  },
  // Active in production only. Counts live in the RateLimit table so every Vercel instance shares them;
  // the limits are per visitor address (see also lib/rate-limit.ts for the public forms).
  rateLimit: {
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 300, max: 10 },
      "/sign-up/email": { window: 3600, max: 5 },
      "/request-password-reset": { window: 3600, max: 5 },
      "/send-verification-email": { window: 3600, max: 5 },
    },
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
