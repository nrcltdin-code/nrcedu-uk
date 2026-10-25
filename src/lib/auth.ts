import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { emailChangeBlockedReason } from "@/lib/account";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { db } from "@/lib/db";
import { emailEnabled, queueEmail } from "@/lib/email";
import { deletePrivateObject } from "@/lib/storage";

// Storage keys of a student's documents, read before their account is deleted and removed after.
const filesOfDeletedUser = new Map<string, string[]>();

// Endpoints whose new session is a person signing in (Google returns through /callback/google).
const signInPaths = ["/sign-in/", "/two-factor/verify-", "/callback/", "/verify-email"];

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Google sign-in switches on once both keys are set. A placeholder such as "-" does not count:
// it would show the button and then fail at Google with "invalid_client".
export const googleEnabled = Boolean(googleClientId?.endsWith(".apps.googleusercontent.com") && googleClientSecret && googleClientSecret.length > 10);

// Sign-in requests are only accepted from APP_URL. Also trust its www / non-www twin, so
// either form of the domain works. Without APP_URL this falls back to localhost only.
function trustedOrigins() {
  if (!process.env.APP_URL) return [];
  const url = new URL(process.env.APP_URL);
  const twin = url.hostname.startsWith("www.") ? url.hostname.slice(4) : `www.${url.hostname}`;
  return [url.origin, `${url.protocol}//${twin}`];
}

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.APP_URL,
  trustedOrigins: trustedOrigins(),
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Password sign-in waits until the address is confirmed, for every role (staff and agents
    // included). Each refused sign-in sends a fresh link (sendOnSignIn below). Only while email
    // sending is set up, otherwise nobody could ever confirm.
    requireEmailVerification: emailEnabled,
    // "Forgot password" emails a one-hour link to /reset-password; resetting signs out other devices.
    sendResetPassword: async ({ user, url }) => {
      queueEmail({
        to: user.email,
        private: true,
        subject: "Reset your NRC password",
        text: `Hello ${user.name},\n\nSomeone asked to reset the password for this account. If it was you, choose a new password here (the link works for one hour):\n${url}\n\nIf it was not you, ignore this email; your password stays the same.`,
      });
    },
    revokeSessionsOnPasswordReset: true,
  },
  // New registrations get a link to confirm their address, and the link signs them in.
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      queueEmail({
        to: user.email,
        private: true,
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
    // Google never takes over an existing password account by itself: that sign-in is refused
    // with "account_not_linked" and the person is asked to use their password (auth-form.tsx).
    accountLinking: { enabled: true, disableImplicitLinking: true },
  },
  user: {
    // A new address must be confirmed by the link sent to it (the emailVerification sender above);
    // the old address is told first so a hijacked session cannot quietly take over the account.
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        queueEmail({
          to: user.email,
          private: true,
        subject: "Approve your new email address",
          text: `Hello ${user.name},\n\nSomeone asked to change the email on your NRC account to ${newEmail}. If it was you, approve the change here:\n${url}\n\nIf it was not you, ignore this email and change your password.`,
        });
      },
    },
    // Students can close their own account from the Account page (password, or a recent sign-in, required).
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        const record = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, studentProfile: { select: { _count: { select: { applications: true } }, documents: { select: { fileKey: true } } } } },
        });
        if (record?.role !== "STUDENT") {
          throw new APIError("FORBIDDEN", { message: "Staff, admin and agent accounts are closed by an admin." });
        }
        if (record.studentProfile?._count.applications) {
          throw new APIError("FORBIDDEN", { message: "You have applications in progress, so please ask your counsellor to close your account." });
        }
        const keys = record.studentProfile?.documents.flatMap((d) => (d.fileKey ? [d.fileKey] : [])) ?? [];
        filesOfDeletedUser.set(user.id, keys);
      },
      afterDelete: async (user) => {
        const keys = filesOfDeletedUser.get(user.id) ?? [];
        filesOfDeletedUser.delete(user.id);
        await Promise.allSettled(keys.map((key) => deletePrivateObject(key)));
      },
    },
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
        // Sign-in history (Account page and Activity log). Only real sign-ins: password, two-step
        // code, Google and email-link; sessions made by a password change or 2FA set-up are not.
        after: async (session, ctx) => {
          const path = ctx?.path ?? "";
          if (!signInPaths.some((p) => path.startsWith(p))) return;
          await db.activityLog.create({
            data: {
              userId: session.userId,
              action: "auth.sign-in",
              entityType: "Session",
              entityId: session.id,
              meta: { userAgent: session.userAgent ?? null, ip: session.ipAddress ?? null },
            },
          });
        },
      },
      delete: {
        // With two-step sign-in on, the password step's session is removed straight away and a new
        // one is made after the code; drop the log entry of that half-finished sign-in.
        after: async (session) => {
          await db.activityLog.deleteMany({
            where: { entityType: "Session", entityId: session.id, createdAt: { gt: new Date(Date.now() - 60_000) } },
          });
        },
      },
    },
  },
  // Server-side check behind the Account page: only students who manage their own account
  // can change their email (see lib/account.ts).
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/change-email") return;
      const session = await getSessionFromCtx(ctx);
      if (!session) return;
      const reason = await emailChangeBlockedReason(session.user.id);
      if (reason) throw new APIError("FORBIDDEN", { message: reason });
    }),
  },
  // Keep last: lets server actions set the session cookie.
  plugins: [
    // Authenticator-app codes after the password, with ten one-time backup codes. Admins and staff
    // must turn it on (dashboard layout); for others it is optional. Google sign-ins skip it.
    twoFactor({ issuer: "NRC Educational Consultants" }),
    nextCookies(),
  ],
});
