import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { londonToday } from "@/lib/reminders";
import { requireRole } from "@/lib/session";
import { ReminderForm } from "./reminder-form";
import { ReminderList } from "./reminder-list";

export const metadata: Metadata = { title: "Reminders", robots: { index: false } };

const tabs = [
  { key: "due", label: "Due" },
  { key: "upcoming", label: "Upcoming" },
  { key: "done", label: "Done" },
] as const;
type Tab = (typeof tabs)[number]["key"];

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default function RemindersPage({ searchParams }: PageProps<"/dashboard/reminders">) {
  return (
    <>
      <PageHeader title="Reminders" description="Your follow-ups: calls to make, documents to chase, deadlines to check." />
      <Suspense fallback={<Card tone="solid">Loading reminders…</Card>}>
        <Reminders searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Reminders({ searchParams }: Pick<PageProps<"/dashboard/reminders">, "searchParams">) {
  const user = await requireRole("ADMIN", "STAFF");
  const params = await searchParams;
  const tab: Tab = tabs.some((t) => t.key === first(params.tab)) ? (first(params.tab) as Tab) : "due";
  // Admins can look at everyone's reminders, e.g. to cover for someone away.
  const everyone = user.role === "ADMIN" && first(params.who) === "all";

  const today = londonToday();
  const owner: Prisma.ReminderWhereInput = everyone ? {} : { staffId: user.id };
  const where: Record<Tab, Prisma.ReminderWhereInput> = {
    due: { ...owner, doneAt: null, dueAt: { lte: today } },
    upcoming: { ...owner, doneAt: null, dueAt: { gt: today } },
    done: { ...owner, doneAt: { not: null } },
  };

  const [rows, counts, staff] = await Promise.all([
    db.reminder.findMany({
      where: where[tab],
      orderBy: tab === "done" ? { doneAt: "desc" } : { dueAt: "asc" },
      take: 100,
      include: {
        staff: { select: { name: true } },
        lead: { select: { id: true, name: true } },
        student: { select: { id: true, user: { select: { name: true } } } },
        application: { select: { id: true, student: { select: { user: { select: { name: true } } } }, course: { select: { name: true } } } },
      },
    }),
    Promise.all(tabs.map((t) => db.reminder.count({ where: where[t.key] }))),
    db.user.findMany({ where: { role: { in: ["ADMIN", "STAFF"] }, status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const tomorrow = new Date(today.getTime() + 86_400_000).toISOString().slice(0, 10);
  const href = (next: Partial<{ tab: string; who: string }>) =>
    `/dashboard/reminders?${new URLSearchParams({ tab, ...(everyone ? { who: "all" } : {}), ...next })}`;

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[1.8fr_1fr]">
      <Card tone="solid">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex gap-1 rounded-full bg-brand-900/8 p-1 text-sm font-semibold" aria-label="Reminder lists">
            {tabs.map((t, i) => (
              <Link
                key={t.key}
                href={href({ tab: t.key })}
                aria-current={t.key === tab ? "page" : undefined}
                className={t.key === tab ? "rounded-full bg-white px-4 py-1.5 text-brand-800 shadow-sm" : "rounded-full px-4 py-1.5 text-muted hover:text-ink"}
              >
                {t.label} <span className="font-normal">{counts[i]}</span>
              </Link>
            ))}
          </nav>
          {user.role === "ADMIN" && (
            <Link href={everyone ? `/dashboard/reminders?tab=${tab}` : href({ who: "all" })} className="text-sm font-medium text-brand-700 hover:underline">
              {everyone ? "Show only mine" : "Show everyone's"}
            </Link>
          )}
        </div>
        <div className="mt-4">
          <ReminderList
            rows={rows}
            canChange
            showRecord
            showOwner={everyone}
            empty={tab === "due" ? "Nothing due. Well done." : tab === "upcoming" ? "No upcoming reminders." : "Nothing done yet."}
          />
        </div>
      </Card>

      <Card tone="solid">
        <h2 className="mb-1 text-xl font-bold">Personal reminder</h2>
        <p className="mb-4 text-sm text-muted">Not tied to a record. To follow up a lead, student or application, add the reminder on its page.</p>
        <ReminderForm key={counts.join("-")} staff={staff} me={user.id} tomorrow={tomorrow} />
      </Card>
    </div>
  );
}
