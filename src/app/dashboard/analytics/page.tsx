import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { countryName } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Website analytics", robots: { index: false } };

const ranges = { "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days", "365": "Last 12 months" } as const;
type Range = keyof typeof ranges;

const number = (n: number) => n.toLocaleString("en-GB");
const dayLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export default function AnalyticsPage({ searchParams }: PageProps<"/dashboard/analytics">) {
  return (
    <>
      <PageHeader title="Website analytics" description="Visits to the public website: pages, locations and where visitors came from." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <Analytics searchParams={searchParams} />
      </Suspense>
    </>
  );
}

// The chosen period, the one before it (for the comparison), and each of its days.
function period(days: number) {
  const now = Date.now();
  const since = new Date(now - days * 86_400_000);
  return {
    since,
    sincePrevious: new Date(since.getTime() - days * 86_400_000),
    dayList: Array.from({ length: days }, (_, i) => new Date(now - (days - 1 - i) * 86_400_000)),
  };
}

type Row = { label: string; views: number; visitors: number };

async function Analytics({ searchParams }: Pick<PageProps<"/dashboard/analytics">, "searchParams">) {
  await requirePermission("MARKETING", "view");
  const { range: given } = await searchParams;
  const range: Range = typeof given === "string" && given in ranges ? (given as Range) : "30";
  const days = Number(range);
  const { since, sincePrevious, dayList } = period(days);

  // One grouped count per breakdown; visitors are distinct daily hashes.
  const top = (column: "path" | "source" | "referrer" | "country" | "city" | "device" | "browser" | "utmCampaign", limit = 10) =>
    db.$queryRawUnsafe<{ label: string | null; views: bigint; visitors: bigint }[]>(
      `SELECT "${column}" AS label, COUNT(*) AS views, COUNT(DISTINCT "visitorHash") AS visitors
       FROM "PageView" WHERE "createdAt" >= $1 ${column === "referrer" || column === "utmCampaign" ? `AND "${column}" IS NOT NULL` : ""}
       GROUP BY 1 ORDER BY 2 DESC LIMIT ${limit}`,
      since,
    );
  const toRows = (rows: { label: string | null; views: bigint; visitors: bigint }[], name = (l: string | null) => l ?? "Unknown"): Row[] =>
    rows.map((r) => ({ label: name(r.label), views: Number(r.views), visitors: Number(r.visitors) }));

  const [totals, previous, daily, pages, sources, referrers, countries, cities, devices, browsers, campaigns] = await Promise.all([
    db.$queryRaw<{ views: bigint; visitors: bigint }[]>`
      SELECT COUNT(*) AS views, COUNT(DISTINCT "visitorHash") AS visitors FROM "PageView" WHERE "createdAt" >= ${since}`,
    db.$queryRaw<{ views: bigint; visitors: bigint }[]>`
      SELECT COUNT(*) AS views, COUNT(DISTINCT "visitorHash") AS visitors FROM "PageView"
      WHERE "createdAt" >= ${sincePrevious} AND "createdAt" < ${since}`,
    db.$queryRaw<{ day: Date; views: bigint; visitors: bigint }[]>`
      SELECT date_trunc('day', "createdAt" AT TIME ZONE 'Europe/London') AS day, COUNT(*) AS views, COUNT(DISTINCT "visitorHash") AS visitors
      FROM "PageView" WHERE "createdAt" >= ${since} GROUP BY 1 ORDER BY 1`,
    top("path"),
    top("source"),
    top("referrer"),
    top("country"),
    top("city"),
    top("device", 5),
    top("browser", 6),
    top("utmCampaign"),
  ]);

  const views = Number(totals[0]?.views ?? 0);
  const visitors = Number(totals[0]?.visitors ?? 0);
  const before = { views: Number(previous[0]?.views ?? 0), visitors: Number(previous[0]?.visitors ?? 0) };

  // Every day in the range, including days with no views.
  const byDay = new Map(daily.map((d) => [d.day.toISOString().slice(0, 10), { views: Number(d.views), visitors: Number(d.visitors) }]));
  const series = dayList.map((date) => {
    const key = date.toISOString().slice(0, 10);
    return { key, date, ...(byDay.get(key) ?? { views: 0, visitors: 0 }) };
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Date range">
        {(Object.keys(ranges) as Range[]).map((key) => (
          <Link
            key={key}
            href={`?range=${key}`}
            aria-current={key === range ? "true" : undefined}
            className={cn("rounded-full px-3 py-1 text-xs font-semibold", key === range ? "bg-brand-600 text-white" : "bg-white/60 text-muted hover:text-ink")}
          >
            {ranges[key]}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Page views" value={views} before={before.views} />
        <Stat label="Visitors" value={visitors} before={before.visitors} />
        <Card tone="solid" className="p-5">
          <p className="text-sm text-muted">Pages per visitor</p>
          <p className="mt-1 font-display text-3xl font-bold">{visitors ? (views / visitors).toFixed(1) : "–"}</p>
        </Card>
      </div>

      <Card tone="solid" className="p-5">
        <h2 className="font-display font-bold">Page views per day</h2>
        {views === 0 ? (
          <p className="mt-3 text-sm text-muted">No visits recorded in this period yet.</p>
        ) : (
          <DailyChart series={series} />
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Breakdown title="Top pages" rows={toRows(pages)} empty="No pages viewed yet." />
        <Breakdown title="How visitors found us" rows={toRows(sources)} empty="No visits yet." />
        <Breakdown title="Countries" rows={toRows(countries, countryName)} empty="No locations yet (they appear on the live site)." />
        <Breakdown title="Cities" rows={toRows(cities)} empty="No locations yet (they appear on the live site)." />
        <Breakdown title="Websites that sent visitors" rows={toRows(referrers)} empty="No visits from other websites yet." />
        <Breakdown title="Tagged campaigns (utm_campaign)" rows={toRows(campaigns)} empty="No visits from tagged links yet." />
        <Breakdown title="Devices" rows={toRows(devices)} empty="No visits yet." />
        <Breakdown title="Browsers" rows={toRows(browsers)} empty="No visits yet." />
      </div>
    </div>
  );
}

function Stat({ label, value, before }: { label: string; value: number; before: number }) {
  const change = before ? Math.round(((value - before) / before) * 100) : null;
  return (
    <Card tone="solid" className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{number(value)}</p>
      <p className="mt-1 text-xs text-muted">
        {change === null ? "No earlier period to compare" : `${change > 0 ? "▲ " : change < 0 ? "▼ " : ""}${Math.abs(change)}% vs the period before`}
      </p>
    </Card>
  );
}

// Single series, one hue; each bar shows its numbers on hover or focus.
function DailyChart({ series }: { series: { key: string; date: Date; views: number; visitors: number }[] }) {
  const max = Math.max(...series.map((d) => d.views), 1);
  const tick = Math.ceil(series.length / 6);
  return (
    <figure className="mt-4">
      <div className="flex h-48 items-end gap-0.5 border-b border-brand-900/15" role="img" aria-label="Page views per day, see table below">
        {series.map((d) => (
          <div key={d.key} className="group relative flex h-full flex-1 items-end" tabIndex={0}>
            <div className="w-full rounded-t bg-brand-600 group-hover:bg-brand-700 group-focus:bg-brand-700" style={{ height: `${(d.views / max) * 100}%`, minHeight: d.views ? 2 : 0 }} />
            <div className="glass-solid pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs shadow-lg group-hover:block group-focus:block">
              <p className="font-semibold">{dayLabel.format(d.date)}</p>
              <p>{number(d.views)} views · {number(d.visitors)} visitors</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-0.5 text-[11px] text-muted" aria-hidden="true">
        {series.map((d, i) => (
          <span key={d.key} className="flex-1 overflow-visible whitespace-nowrap">{i % tick === 0 ? dayLabel.format(d.date) : ""}</span>
        ))}
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-brand-700">Show as a table</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-muted"><tr><th className="py-1 font-medium">Day</th><th className="font-medium">Views</th><th className="font-medium">Visitors</th></tr></thead>
          <tbody>
            {series.filter((d) => d.views).map((d) => (
              <tr key={d.key} className="border-t border-brand-900/8"><td className="py-1">{dayLabel.format(d.date)}</td><td>{number(d.views)}</td><td>{number(d.visitors)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

function Breakdown({ title, rows, empty }: { title: string; rows: Row[]; empty: string }) {
  const max = Math.max(...rows.map((r) => r.views), 1);
  return (
    <Card tone="solid" className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display font-bold">{title}</h2>
        {rows.length > 0 && <span className="text-xs text-muted">views · visitors</span>}
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 grid gap-1.5 text-sm">
          {rows.map((row) => (
            <li key={row.label} className="relative overflow-hidden rounded-lg px-2.5 py-1.5">
              <span className="absolute inset-y-0 left-0 rounded-lg bg-brand-600/12" style={{ width: `${(row.views / max) * 100}%` }} aria-hidden="true" />
              <span className="relative flex items-center justify-between gap-3">
                <span className="min-w-0 truncate" title={row.label}>{row.label}</span>
                <span className="shrink-0 tabular-nums text-muted">{number(row.views)} · {number(row.visitors)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
