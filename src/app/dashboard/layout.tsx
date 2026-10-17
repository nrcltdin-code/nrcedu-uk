import { Suspense } from "react";
import { AccountOnlyGate } from "@/components/dashboard/account-only-gate";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { VerifyEmailBanner } from "@/components/dashboard/verify-email-banner";
import { getDashboardNav } from "@/lib/dashboard-nav";
import { unreadNotificationCount } from "@/lib/notifications";
import { requireSignedInUser } from "@/lib/session";
import { roleLabels } from "./users/labels";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  // Gated accounts (see lib/session.ts) get the shell and the card below. The card is only what they
  // see: every page other than Account stops on the server before loading any data.
  const user = await requireSignedInUser();
  const [nav, unreadNotifications] = await Promise.all([getDashboardNav(user), unreadNotificationCount(user.id)]);

  let content = children;
  if (user.gate === "confirm-email") {
    content = (
      <AccountOnlyGate
        title="Confirm your email"
        message="Open the link we emailed you to start using your account. Wrong address? Change it on the Account page."
        action={<div className="mt-6 text-left"><VerifyEmailBanner email={user.email} /></div>}
      >
        {children}
      </AccountOnlyGate>
    );
  } else if (user.gate === "two-factor") {
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
