import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDashboardNav } from "@/lib/dashboard-nav";
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
    <DashboardShell nav={nav} user={{ name: user.name, email: user.email, roleLabel: roleLabels[user.role] }}>
      {children}
    </DashboardShell>
  );
}
