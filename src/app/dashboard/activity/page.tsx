import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/field";
import { activityAreas, activityHref, activityWhere, describeAction, readActivityFilter } from "@/lib/activity";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Activity log", robots: { index: false } };

const pageSize = 50;
const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });

export default function ActivityPage({ searchParams }: PageProps<"/dashboard/activity">) {
  return (
    <Suspense fallback={<Card tone="solid">Loading activity…</Card>}>
      <Activity searchParams={searchParams} />
    </Suspense>
  );
}

// Short summary of what changed, from the "from → to" pairs some actions store.
function changes(meta: unknown) {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const parts = Object.entries(meta as Record<string, unknown>)
    .filter(([, value]) => value && typeof value === "object" && "to" in (value as object))
    .map(([key, value]) => {
      const { from, to } = value as { from: unknown; to: unknown };
      return `${key}: ${String(from ?? "—")} → ${String(to ?? "—")}`;
    });
  return parts.length ? parts.join(" · ") : null;
}

async function Activity({ searchParams }: Pick<PageProps<"/dashboard/activity">, "searchParams">) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const filter = readActivityFilter(params);
  const pageParam = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const where = activityWhere(filter);

  const [entries, total, people] = await Promise.all([
    db.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { name: true } } },
    }),
    db.activityLog.count({ where }),
    db.user.findMany({ where: { role: { in: ["ADMIN", "STAFF"] } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const query = (extra: Record<string, string>) => new URLSearchParams({ ...filter, ...extra }).toString();

  return (
    <>
      <PageHeader
        title="Activity log"
        description="Who changed what, and when. Only admins see this page."
        actions={<a href={`/api/export/activity?${query({})}`} className={buttonStyles({ variant: "glass", size: "sm" })}>Download CSV</a>}
      />
      <Card tone="solid">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto_auto] lg:items-end">
          <div>
            <Label htmlFor="act-who">Person</Label>
            <Select id="act-who" name="who" defaultValue={filter.who}>
              <option value="">Everyone</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="act-area">Area</Label>
            <Select id="act-area" name="area" defaultValue={filter.area}>
              <option value="">All areas</option>
              {Object.entries(activityAreas).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="act-from">From</Label>
            <Input id="act-from" name="from" type="date" defaultValue={filter.from} />
          </div>
          <div>
            <Label htmlFor="act-to">To</Label>
            <Input id="act-to" name="to" type="date" defaultValue={filter.to} />
          </div>
          <Button type="submit" variant="glass">Filter</Button>
        </form>

        <p className="mt-4 text-sm text-muted">
          {total.toLocaleString("en-GB")} {total === 1 ? "entry" : "entries"}
          {(filter.who || filter.area || filter.from || filter.to) && (
            <> · <Link href="/dashboard/activity" className="text-brand-700 hover:underline">Clear filters</Link></>
          )}
        </p>
        <ul className="mt-2 divide-y divide-brand-900/10 text-sm">
          {entries.map((entry) => {
            const href = activityHref(entry.entityType, entry.entityId);
            const detail = changes(entry.meta);
            return (
              <li key={entry.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-2.5">
                <div className="min-w-0">
                  <p>
                    <span className="font-medium">{entry.user?.name ?? "Someone"}</span> {describeAction(entry.action)}
                    {href && <> · <Link href={href} className="text-brand-700 hover:underline">open</Link></>}
                  </p>
                  {detail && <p className="mt-0.5 break-words text-xs text-muted">{detail}</p>}
                </div>
                <span className="shrink-0 text-xs text-muted">{dateTime.format(entry.createdAt)}</span>
              </li>
            );
          })}
          {entries.length === 0 && <li className="py-3 text-muted">No activity matches.</li>}
        </ul>

        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            {page > 1 ? <Link href={`/dashboard/activity?${query({ page: String(page - 1) })}`} className={buttonStyles({ variant: "ghost", size: "sm" })}>← Newer</Link> : <span />}
            <span className="text-muted">Page {page} of {pages}</span>
            {page < pages ? <Link href={`/dashboard/activity?${query({ page: String(page + 1) })}`} className={buttonStyles({ variant: "ghost", size: "sm" })}>Older →</Link> : <span />}
          </div>
        )}
      </Card>
    </>
  );
}
