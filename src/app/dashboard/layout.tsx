import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { VerifyEmailBanner } from "@/components/dashboard/verify-email-banner";
import { getDashboardNav } from "@/lib/dashboard-nav";
import { unreadNotificationCount } from "@/lib/notifications";
import { emailEnabled } from "@/lib/email";
import { requireUser } from "@/lib/session";
import { roleLabels } from "./users/labels";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [nav, unreadNotifications] = await Promise.all([getDashboardNav(user), unreadNotificationCount(user.id)]);

  return (
    <DashboardShell nav={nav} user={{ name: user.name, email: user.email, role: user.role, roleLabel: roleLabels[user.role] }} unreadNotifications={unreadNotifications}>
      {!user.emailVerified && emailEnabled && <VerifyEmailBanner email={user.email} />}
      {children}
    </DashboardShell>
  );
}
