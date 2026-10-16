import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
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
  const [record, current, sessions] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { phone: true, accounts: { where: { providerId: "credential" }, select: { password: true } } },
    }),
    auth.api.getSession({ headers: requestHeaders }),
    auth.api.listSessions({ headers: requestHeaders }),
  ]);

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
          <EmailForm email={user.email} verified={user.emailVerified} emailEnabled={emailEnabled} />
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
