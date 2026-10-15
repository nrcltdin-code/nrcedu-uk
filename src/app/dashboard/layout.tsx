import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { VerifyEmailBanner } from "@/components/dashboard/verify-email-banner";
import { getDashboardNav } from "@/lib/dashboard-nav";
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
  const nav = await getDashboardNav(user);

  return (
    <DashboardShell nav={nav} user={{ name: user.name, email: user.email, role: user.role, roleLabel: roleLabels[user.role] }}>
      {!user.emailVerified && emailEnabled && <VerifyEmailBanner email={user.email} />}
      {children}
    </DashboardShell>
  );
}
