import { Suspense } from "react";
import { AccountOnlyGate } from "@/components/dashboard/account-only-gate";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { VerifyEmailBanner } from "@/components/dashboard/verify-email-banner";
import { getDashboardNav } from "@/lib/dashboard-nav";
import { db } from "@/lib/db";
import { emailEnabled } from "@/lib/email";
import { unreadNotificationCount } from "@/lib/notifications";
import { requireUser } from "@/lib/session";
import type { CurrentUser } from "@/lib/session";
import { roleLabels } from "./users/labels";

// Admins and staff who sign in with a password must turn on two-step sign-in.
// Google-only accounts are covered by their Google account's own security.
async function needsTwoFactor(user: CurrentUser) {
  if (user.twoFactorEnabled || (user.role !== "ADMIN" && user.role !== "STAFF")) return false;
  const credential = await db.account.findFirst({ where: { userId: user.id, providerId: "credential", password: { not: null } }, select: { id: true } });
  return Boolean(credential);
}

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [nav, unreadNotifications, mustSetUpTwoFactor] = await Promise.all([
    getDashboardNav(user),
    unreadNotificationCount(user.id),
    needsTwoFactor(user),
  ]);
  // Sign-in already refuses unconfirmed addresses; this catches sessions from before that rule.
  const mustConfirmEmail = !user.emailVerified && emailEnabled;

  let content = children;
  if (mustConfirmEmail) {
    content = (
      <AccountOnlyGate
        title="Confirm your email"
        message="Open the link we emailed you to start using your account. Wrong address? Change it on the Account page."
        action={<div className="mt-6 text-left"><VerifyEmailBanner email={user.email} /></div>}
      >
        {children}
      </AccountOnlyGate>
    );
  } else if (mustSetUpTwoFactor) {
    content = (
      <AccountOnlyGate
        title="Set up two-step sign-in"
        message="Admin and staff accounts can see student passports and documents, so they need a code from an authenticator app as well as the password. It takes about a minute."
      >
        {children}
      </AccountOnlyGate>
    );
  }

  return (
    <DashboardShell nav={nav} user={{ name: user.name, email: user.email, role: user.role, roleLabel: roleLabels[user.role] }} unreadNotifications={unreadNotifications}>
      {content}
    </DashboardShell>
  );
}
