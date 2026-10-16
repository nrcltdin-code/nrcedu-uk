import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { VerifyEmailBanner } from "@/components/dashboard/verify-email-banner";
import { getDashboardNav } from "@/lib/dashboard-nav";
import { unreadNotificationCount } from "@/lib/notifications";
import { emailEnabled } from "@/lib/email";
import { requireUser } from "@/lib/session";
import { TwoFactorGate } from "@/components/dashboard/two-factor-gate";
import { db } from "@/lib/db";
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

  return (
    <DashboardShell nav={nav} user={{ name: user.name, email: user.email, role: user.role, roleLabel: roleLabels[user.role] }} unreadNotifications={unreadNotifications}>
      {!user.emailVerified && emailEnabled && <VerifyEmailBanner email={user.email} />}
      {mustSetUpTwoFactor ? <TwoFactorGate>{children}</TwoFactorGate> : children}
    </DashboardShell>
  );
}
