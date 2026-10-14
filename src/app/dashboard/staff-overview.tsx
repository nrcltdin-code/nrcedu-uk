import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { activityHref, describeAction } from "@/lib/activity";
import { formatDate } from "@/lib/format";
import { dueLabel, londonToday } from "@/lib/reminders";
import { can } from "@/lib/session";
import type { CurrentUser } from "@/lib/session";
import { closedStages, stageLabels, stages, stageTones } from "./applications/labels";


function timeAgo(date: Date) {
  const minutes = Math.round((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return formatDate(date);
}

// Staff home: their own work, the application pipeline and (admins) recent activity.
export async function StaffOverview({ user }: { user: CurrentUser }) {
  const [leads, applications] = await Promise.all([can(user, "LEADS"), can(user, "APPLICATIONS")]);
  const isAdmin = user.role === "ADMIN";

  const [myReminders, myLeads, myApps, pipeline, activity] = await Promise.all([
    db.reminder.findMany({
      where: { staffId: user.id, doneAt: null, dueAt: { lte: londonToday() } },
      orderBy: { dueAt: "asc" },
      take: 6,
      select: { id: true, text: true, dueAt: true },
    }),
    leads
      ? db.lead.findMany({
          where: { assignedStaffId: user.id, status: { in: ["NEW", "CONTACTED"] } },
          orderBy: { createdAt: "asc" },
          take: 6,
          select: { id: true, name: true, status: true, createdAt: true },
        })
      : [],
    applications
      ? db.application.findMany({
          where: { assignedStaffId: user.id, stage: { notIn: closedStages } },
          orderBy: { updatedAt: "asc" },
          take: 6,
          select: { id: true, stage: true, updatedAt: true, student: { select: { user: { select: { name: true } } } } },
        })
      : [],
    applications ? db.application.groupBy({ by: ["stage"], where: { stage: { notIn: closedStages } }, _count: true }) : [],
    isAdmin
      ? db.activityLog.findMany({
          where: { action: { not: "document.start" } },
          orderBy: { createdAt: "desc" },
          take: 12,
          select: { id: true, action: true, entityType: true, entityId: true, createdAt: true, user: { select: { name: true } } },
        })
      : [],
  ]);

  const counts = stages
    .filter((stage) => !closedStages.includes(stage))
    .map((stage) => ({ stage, count: pipeline.find((p) => p.stage === stage)?._count ?? 0 }));
  const max = Math.max(1, ...counts.map((c) => c.count));

  return (
    <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
      <Card tone="solid">
        <h2 className="text-xl font-bold">My work</h2>
        <h3 className="mt-4 text-sm font-semibold uppercase tracking-wider text-muted">Reminders due</h3>
        <ul className="mt-1 divide-y divide-brand-900/10">
          {myReminders.map((reminder) => {
            const due = dueLabel(reminder.dueAt);
            return (
              <li key={reminder.id} className="flex items-center justify-between gap-2 px-2 py-2.5">
                <span className="min-w-0 truncate font-medium">{reminder.text}</span>
                <Badge tone={due.tone}>{due.text}</Badge>
              </li>
            );
          })}
          {myReminders.length === 0 && <li className="py-2 text-sm text-muted">Nothing due today.</li>}
        </ul>
        <Link href="/dashboard/reminders" className="mt-1 inline-block text-sm font-medium text-brand-700 hover:underline">All reminders →</Link>
        {leads && (
          <>
            <h3 className="mt-4 text-sm font-semibold uppercase tracking-wider text-muted">Leads to follow up</h3>
            <ul className="mt-1 divide-y divide-brand-900/10">
              {myLeads.map((lead) => (
                <li key={lead.id}>
                  <Link href={`/dashboard/leads/${lead.id}`} className="flex items-center justify-between gap-2 rounded-xl px-2 py-2.5 hover:bg-brand-600/5">
                    <span className="font-medium">{lead.name}</span>
                    <span className="text-xs text-muted">{lead.status === "NEW" ? "New" : "Contacted"} · {timeAgo(lead.createdAt)}</span>
                  </Link>
                </li>
              ))}
              {myLeads.length === 0 && <li className="py-2 text-sm text-muted">None assigned to you.</li>}
            </ul>
          </>
        )}
        {applications && (
          <>
            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted">My applications, longest waiting first</h3>
            <ul className="mt-1 divide-y divide-brand-900/10">
              {myApps.map((app) => (
                <li key={app.id}>
                  <Link href={`/dashboard/applications/${app.id}`} className="flex items-center justify-between gap-2 rounded-xl px-2 py-2.5 hover:bg-brand-600/5">
                    <span className="font-medium">{app.student.user.name}</span>
                    <span className="flex items-center gap-2 text-xs text-muted">
                      <Badge tone={stageTones[app.stage]}>{stageLabels[app.stage]}</Badge>
                      {timeAgo(app.updatedAt)}
                    </span>
                  </Link>
                </li>
              ))}
              {myApps.length === 0 && <li className="py-2 text-sm text-muted">None assigned to you.</li>}
            </ul>
          </>
        )}
      </Card>

      {applications && (
        <Card tone="solid">
          <h2 className="text-xl font-bold">Application pipeline</h2>
          <ul className="mt-4 grid gap-2.5">
            {counts.map(({ stage, count }) => (
              <li key={stage}>
                <Link href={`/dashboard/applications?stage=${stage}`} className="grid grid-cols-[9.5rem_1fr_2rem] items-center gap-3 rounded-lg text-sm hover:bg-brand-600/5">
                  <span className="truncate">{stageLabels[stage]}</span>
                  <span className="h-3 rounded-full bg-brand-900/8">
                    <span className="block h-3 rounded-full bg-brand-600" style={{ width: `${(count / max) * 100}%` }} />
                  </span>
                  <span className="text-right font-semibold">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {isAdmin && (
        <Card tone="solid" className="xl:col-span-2">
          <h2 className="text-xl font-bold">Recent activity</h2>
          <ul className="mt-3 divide-y divide-brand-900/10 text-sm">
            {activity.map((entry) => {
              const href = activityHref(entry.entityType, entry.entityId);
              const text = (
                <>
                  <span className="font-medium">{entry.user?.name ?? "Someone"}</span> {describeAction(entry.action)}
                </>
              );
              return (
                <li key={entry.id} className="flex items-center justify-between gap-3 py-2">
                  {href ? <Link href={href} className="hover:underline">{text}</Link> : <span>{text}</span>}
                  <span className="shrink-0 text-xs text-muted">{timeAgo(entry.createdAt)}</span>
                </li>
              );
            })}
            {activity.length === 0 && <li className="py-2 text-muted">Nothing yet.</li>}
          </ul>
          <Link href="/dashboard/activity" className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline">Full activity log →</Link>
        </Card>
      )}
    </div>
  );
}
