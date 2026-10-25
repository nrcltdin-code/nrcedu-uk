import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/field";
import type { EmailStatus, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { emailEnabled } from "@/lib/email";
import { alertKinds, getEmailSettings, sendingDomain } from "@/lib/email-settings";
import { requirePermission } from "@/lib/session";
import { EmailSettingsForm, ResendButton } from "./email-forms";

export const metadata: Metadata = { title: "Email", robots: { index: false } };

const pageSize = 50;
const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });

const statuses: Record<EmailStatus, { label: string; tone: "brand" | "success" | "danger" | "neutral" | "accent" }> = {
  SENT: { label: "Sent", tone: "brand" },
  DELIVERED: { label: "Delivered", tone: "success" },
  BOUNCED: { label: "Bounced", tone: "danger" },
  COMPLAINED: { label: "Marked as spam", tone: "danger" },
  FAILED: { label: "Failed", tone: "danger" },
  OFF: { label: "Not sent (email off)", tone: "neutral" },
};

export default function EmailPage({ searchParams }: PageProps<"/dashboard/emails">) {
  return (
    <>
      <PageHeader
        title="Email"
        description="Who sends the site's emails, where staff alerts go, and every email sent."
        actions={<Link href="/dashboard/emails/templates" className={buttonStyles({ variant: "glass", size: "sm" })}>Email templates</Link>}
      />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <Email searchParams={searchParams} />
      </Suspense>
    </>
  );
}

// Outside the component: reading the clock during render is flagged as impure.
const daysAgo = (days: number) => new Date(Date.now() - days * 864e5);
const problemStatuses: EmailStatus[] = ["BOUNCED", "COMPLAINED", "FAILED"];

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

async function Email({ searchParams }: Pick<PageProps<"/dashboard/emails">, "searchParams">) {
  await requirePermission("SETTINGS", "edit");
  const params = await searchParams;
  const q = one(params.q).trim().slice(0, 100);
  const raw = one(params.status);
  const status = raw === "PROBLEMS" || raw in statuses ? raw : "";
  const page = Math.max(1, Number.parseInt(one(params.page) || "1", 10) || 1);

  const where: Prisma.EmailLogWhereInput = {
    ...(status === "PROBLEMS" ? { status: { in: problemStatuses } } : status ? { status: status as EmailStatus } : {}),
    ...(q ? { OR: [{ to: { contains: q, mode: "insensitive" } }, { subject: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [settings, countries, entries, total, problems] = await Promise.all([
    getEmailSettings(),
    db.country.findMany({ select: { id: true, name: true } }),
    db.emailLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    db.emailLog.count({ where }),
    db.emailLog.count({ where: { status: { in: problemStatuses }, createdAt: { gte: daysAgo(7) } } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const query = (extra: Record<string, string>) => new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), ...extra }).toString();
  const countryName = (id: string) => countries.find((c) => c.id === id)?.name;

  return (
    <div className="grid gap-6">
      {!emailEnabled && (
        <Card tone="solid" className="border-accent-500/40 text-sm">
          Email sending is switched off (no mail service key is set), so emails are only listed here and not delivered.
        </Card>
      )}
      {!process.env.EMAIL_WEBHOOK_SECRET && emailEnabled && (
        <Card tone="solid" className="text-sm text-muted">
          Delivery tracking is not set up yet, so emails stay at &quot;Sent&quot;. Add a webhook in Resend pointing to <code>/api/email/webhook</code> and put its signing secret in <code>EMAIL_WEBHOOK_SECRET</code>.
        </Card>
      )}

      <Card tone="solid" className="p-6">
        <h2 className="mb-4 text-lg font-bold">Settings</h2>
        <EmailSettingsForm
          domain={sendingDomain()}
          fromName={settings.fromName}
          fromAddress={settings.fromAddress}
          replyTo={settings.replyTo}
          alerts={alertKinds.map((kind) => ({ ...kind, value: settings.alerts[kind.key].join("\n") }))}
          countryInboxes={settings.countryInboxes.flatMap((row) => (countryName(row.countryId) ? [`${countryName(row.countryId)} | ${row.email}`] : [])).join("\n")}
        />
      </Card>

      <Card tone="solid">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">Sent emails</h2>
          {problems > 0 && (
            <Link href="/dashboard/emails?status=PROBLEMS" className="text-sm text-red-700 hover:underline">
              {problems} {problems === 1 ? "problem" : "problems"} in the last 7 days
            </Link>
          )}
        </div>
        <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div>
            <Label htmlFor="em-q">Search</Label>
            <Input id="em-q" name="q" defaultValue={q} placeholder="Address or subject" />
          </div>
          <div>
            <Label htmlFor="em-status">Status</Label>
            <Select id="em-status" name="status" defaultValue={status}>
              <option value="">All</option>
              <option value="PROBLEMS">Any problem</option>
              {Object.entries(statuses).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
            </Select>
          </div>
          <Button type="submit" variant="glass">Filter</Button>
        </form>

        <p className="mt-4 text-sm text-muted">
          {total.toLocaleString("en-GB")} {total === 1 ? "email" : "emails"}
          {(q || status) && <> · <Link href="/dashboard/emails" className="text-brand-700 hover:underline">Clear filters</Link></>}
        </p>
        <ul className="mt-2 divide-y divide-brand-900/10 text-sm">
          {entries.map((entry) => (
            <li key={entry.id}>
              <details className="group py-2.5">
                <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0">
                    <p className="break-words font-medium">{entry.subject}</p>
                    <p className="break-words text-xs text-muted">
                      To {entry.to}
                      {entry.cc && <> · copy to {entry.cc}</>}
                      {entry.kind && <> · {entry.kind}</>}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge tone={statuses[entry.status].tone}>{statuses[entry.status].label}</Badge>
                    <span className="text-xs text-muted">{dateTime.format(entry.createdAt)}</span>
                  </span>
                </summary>
                <div className="mt-3 grid gap-3 rounded-xl bg-brand-900/5 p-3">
                  {entry.error && <p className="break-words text-red-700">{entry.error}</p>}
                  {entry.replyTo && <p className="text-xs text-muted">Replies go to {entry.replyTo}</p>}
                  {entry.text === null ? (
                    <p className="text-muted">This email held a private sign-in or password link, so its text is not kept and it cannot be resent.</p>
                  ) : (
                    <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words font-sans text-sm">{entry.text}</pre>
                  )}
                  {entry.attachments > 0 && <p className="text-xs text-muted">{entry.attachments} attachment{entry.attachments === 1 ? "" : "s"} (not kept)</p>}
                  {entry.text !== null && entry.attachments === 0 && <ResendButton id={entry.id} />}
                </div>
              </details>
            </li>
          ))}
          {entries.length === 0 && <li className="py-3 text-muted">No emails match.</li>}
        </ul>

        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            {page > 1 ? <Link href={`/dashboard/emails?${query({ page: String(page - 1) })}`} className={buttonStyles({ variant: "ghost", size: "sm" })}>← Newer</Link> : <span />}
            <span className="text-muted">Page {page} of {pages}</span>
            {page < pages ? <Link href={`/dashboard/emails?${query({ page: String(page + 1) })}`} className={buttonStyles({ variant: "ghost", size: "sm" })}>Older →</Link> : <span />}
          </div>
        )}
      </Card>
    </div>
  );
}
