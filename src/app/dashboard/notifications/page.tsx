import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { markAllNotificationsRead } from "./actions";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default function NotificationsPage() {
  return (
    <>
      <PageHeader title="Notifications" description="Updates on the work you can see: new leads, applications, documents, messages and more." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <Notifications />
      </Suspense>
    </>
  );
}

async function Notifications() {
  const user = await requireUser();
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, title: true, body: true, href: true, readAt: true, createdAt: true },
  });
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <Card tone="solid">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">{unread ? `${unread} unread` : "All caught up"}</p>
        {unread > 0 && (
          <form action={markAllNotificationsRead}>
            <Button size="sm" variant="glass">Mark all as read</Button>
          </form>
        )}
      </div>
      <ul className="mt-2 divide-y divide-brand-900/10">
        {notifications.map((n) => {
          const inner = (
            <>
              <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: n.readAt ? "transparent" : "var(--color-accent-500)" }} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className={n.readAt ? "block" : "block font-semibold"}>{n.title}{!n.readAt && <span className="sr-only"> (unread)</span>}</span>
                {n.body && <span className="block text-sm text-muted">{n.body}</span>}
                <span className="block text-xs text-muted">{formatDate(n.createdAt)}</span>
              </span>
            </>
          );
          return (
            <li key={n.id}>
              {/* A plain link, not <Link>: prefetching would mark the notice as read. */}
              <a href={`/dashboard/notifications/${n.id}`} className="flex gap-3 rounded-xl px-2 py-3 hover:bg-brand-600/5">
                {inner}
              </a>
            </li>
          );
        })}
        {notifications.length === 0 && <li className="py-3 text-muted">No notifications yet.</li>}
      </ul>
    </Card>
  );
}
