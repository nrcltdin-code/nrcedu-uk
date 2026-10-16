import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { emailChangeBlockedReason } from "@/lib/account";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { describeDevice, isMobileDevice } from "@/lib/device";
import { emailEnabled } from "@/lib/email";
import { requireUser } from "@/lib/session";
import { DeleteAccount, DetailsForm, Devices, EmailForm, PasswordForm, TwoFactorPanel } from "./account-forms";
import type { DeviceSession } from "./account-forms";

export const metadata: Metadata = { title: "Account and security", robots: { index: false } };

const when = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });

export default function AccountPage() {
  return (
    <>
      <PageHeader title="Account and security" description="Your sign-in details, two-step sign-in and the devices signed in to your account." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <Account />
      </Suspense>
    </>
  );
}

async function Account() {
  const user = await requireUser();
  const requestHeaders = await headers();
  const [record, current, sessions, history, emailBlockedReason] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { phone: true, accounts: { where: { providerId: "credential" }, select: { password: true } } },
    }),
    auth.api.getSession({ headers: requestHeaders }),
    // Read directly: Better Auth's listSessions refuses sessions older than a day ("not fresh").
    db.session.findMany({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      select: { id: true, token: true, userAgent: true, ipAddress: true, updatedAt: true },
    }),
    db.activityLog.findMany({
      where: { userId: user.id, action: "auth.sign-in" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, entityId: true, meta: true, createdAt: true },
    }),
    emailChangeBlockedReason(user.id),
  ]);
  const activeIds = new Set(sessions.map((s) => s.id));

  const hasPassword = record.accounts.some((a) => a.password);
  const twoFactorRequired = user.role === "ADMIN" || user.role === "STAFF";
  const devices: DeviceSession[] = sessions
    .toSorted((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((s) => ({
      token: s.token,
      device: describeDevice(s.userAgent),
      mobile: isMobileDevice(s.userAgent),
      ip: s.ipAddress ?? null,
      lastActive: when.format(s.updatedAt),
      current: s.token === current?.session.token,
    }));

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      {twoFactorRequired && !user.twoFactorEnabled && (
        <Card tone="solid" className="border-amber-500/40 bg-amber-500/10 xl:col-span-2">
          <p className="text-sm text-amber-900">
            <strong>Two-step sign-in is required for admin and staff accounts.</strong> Set it up below to use the rest of the dashboard.
          </p>
        </Card>
      )}
      <div className="grid gap-6">
        <Card tone="solid">
          <h2 className="mb-4 text-xl font-bold">Your details</h2>
          <DetailsForm name={user.name} phone={record.phone} />
        </Card>
        <Card tone="solid">
          <h2 className="mb-4 text-xl font-bold">Email</h2>
          <EmailForm email={user.email} verified={user.emailVerified} emailEnabled={emailEnabled} blockedReason={emailBlockedReason} />
        </Card>
        <Card tone="solid">
          <h2 className="mb-4 text-xl font-bold">Password</h2>
          <PasswordForm hasPassword={hasPassword} email={user.email} emailEnabled={emailEnabled} />
        </Card>
      </div>
      <div className="grid gap-6">
        <Card tone="solid">
          <h2 className="mb-4 text-xl font-bold">Two-step sign-in</h2>
          <TwoFactorPanel enabled={user.twoFactorEnabled} hasPassword={hasPassword} required={twoFactorRequired} />
        </Card>
        <Card tone="solid">
          <h2 className="mb-4 text-xl font-bold">Signed-in devices</h2>
          <Devices sessions={devices} />
        </Card>
        <Card tone="solid">
          <h2 className="text-xl font-bold">Sign-in history</h2>
          <p className="mb-4 mt-1 text-sm text-muted">Your last {history.length || 20} sign-ins. If one was not you, sign that device out and change your password.</p>
          {history.length === 0 ? (
            <p className="text-sm text-muted">Sign-ins from now on are listed here.</p>
          ) : (
            <ul className="divide-y divide-brand-900/10">
              {history.map((entry) => {
                const meta = (entry.meta ?? {}) as { userAgent?: string | null; ip?: string | null };
                const active = entry.entityId !== null && activeIds.has(entry.entityId);
                return (
                  <li key={entry.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{describeDevice(meta.userAgent)}</p>
                      <p className="text-xs text-muted">{when.format(entry.createdAt)}{meta.ip && ` · ${meta.ip}`}</p>
                    </div>
                    {active
                      ? <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-xs font-semibold text-emerald-800">Still signed in</span>
                      : <span className="rounded-full bg-brand-900/8 px-2 py-0.5 text-xs font-semibold text-muted">Signed out</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        {user.role === "STUDENT" && (
          <Card tone="solid">
            <h2 className="mb-4 text-xl font-bold">Close account</h2>
            <DeleteAccount hasPassword={hasPassword} />
          </Card>
        )}
      </div>
    </div>
  );
}
