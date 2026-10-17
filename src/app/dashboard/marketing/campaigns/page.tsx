import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { can, requirePermission } from "@/lib/session";
import { deleteCampaign } from "../actions";
import { CampaignForm } from "../forms";
import { asCampaignStatus, asChannel, campaignStatusLabels, campaignStatusTones, channelLabels, dateValue } from "../labels";

export const metadata: Metadata = { title: "Campaigns", robots: { index: false } };

export default function CampaignsPage({ searchParams }: PageProps<"/dashboard/marketing/campaigns">) {
  return (
    <>
      <PageHeader title="Campaigns" description="Social, email, SMS, ads and events: plan, design, run and record the results." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <Campaigns searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Campaigns({ searchParams }: Pick<PageProps<"/dashboard/marketing/campaigns">, "searchParams">) {
  const user = await requirePermission("MARKETING", "view");
  const canEdit = await can(user, "MARKETING", "edit");
  const params = await searchParams;
  const one = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const status = asCampaignStatus(one("status"));
  const channel = asChannel(one("channel"));

  const rows = await db.campaign.findMany({
    where: { ...(status && { status }), ...(channel && { channel }) },
    orderBy: [{ startDate: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
    include: { _count: { select: { posts: true } } },
  });
  const editing = canEdit ? rows.find((row) => row.id === one("edit")) ?? (one("edit") ? await db.campaign.findUnique({ where: { id: one("edit") } }) : null) : null;

  const filterHref = (next: { status?: string | null; channel?: string | null }) => {
    const query = new URLSearchParams();
    const s = next.status === undefined ? status : next.status;
    const c = next.channel === undefined ? channel : next.channel;
    if (s) query.set("status", s);
    if (c) query.set("channel", c);
    const text = query.toString();
    return `/dashboard/marketing/campaigns${text ? `?${text}` : ""}`;
  };
  const chip = (active: boolean) =>
    cn("rounded-full px-3 py-1 text-xs font-semibold", active ? "bg-brand-600 text-white" : "bg-white/60 text-muted hover:text-ink");

  return (
    <div className={cn("grid items-start gap-8", canEdit && "lg:grid-cols-[1.3fr_1fr]")}>
      <div className="grid gap-4">
        <div className="flex flex-wrap gap-1.5">
          <Link href={filterHref({ status: null })} className={chip(!status)}>All</Link>
          {Object.entries(campaignStatusLabels).map(([value, label]) => (
            <Link key={value} href={filterHref({ status: value })} className={chip(status === value)}>{label}</Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Link href={filterHref({ channel: null })} className={chip(!channel)}>Every channel</Link>
          {Object.entries(channelLabels).map(([value, label]) => (
            <Link key={value} href={filterHref({ channel: value })} className={chip(channel === value)}>{label}</Link>
          ))}
        </div>

        <ul className="grid gap-4">
          {rows.length === 0 && <Card tone="solid">No campaigns here yet.</Card>}
          {rows.map((row) => (
            <li key={row.id}>
              <Card tone="solid" className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display font-bold">{row.name}</h2>
                  <Badge tone={campaignStatusTones[row.status]}>{campaignStatusLabels[row.status]}</Badge>
                  <Badge tone="neutral">{channelLabels[row.channel]}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {row.startDate ? formatDate(row.startDate) : "No start date"}
                  {row.endDate && ` – ${formatDate(row.endDate)}`}
                  {row.budget && ` · Budget ${formatMoney(Number(row.budget), row.currency)}`}
                  {row.owner && ` · ${row.owner}`}
                  {row._count.posts > 0 && ` · ${row._count.posts} planned post${row._count.posts === 1 ? "" : "s"}`}
                </p>
                {row.goal && <p className="mt-2 text-sm"><span className="font-semibold">Goal:</span> {row.goal}</p>}
                {row.audience && <p className="mt-1 text-sm"><span className="font-semibold">Audience:</span> {row.audience}</p>}
                {row.message && <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted">{row.message}</p>}
                {row.results && <p className="mt-2 whitespace-pre-line text-sm"><span className="font-semibold">Results:</span> {row.results}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-1">
                  {row.designUrl && (
                    <a href={row.designUrl} target="_blank" rel="noreferrer" className={buttonStyles({ variant: "ghost", size: "sm" })}>Open design</a>
                  )}
                  {canEdit && (
                    <>
                      <Link href={`/dashboard/marketing/campaigns?edit=${row.id}`} className={buttonStyles({ variant: "glass", size: "sm" })}>Edit</Link>
                      <DeleteButton action={deleteCampaign.bind(null, row.id)} question={`Delete ${row.name}? Its planned posts stay, without a campaign.`} />
                    </>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </div>

      {canEdit && (
        <Card tone="solid">
          <h2 className="mb-4 text-xl font-bold">{editing ? "Edit campaign" : "Add a campaign"}</h2>
          <CampaignForm
            key={editing?.id ?? "new"}
            campaign={
              editing && {
                ...editing,
                startDate: dateValue(editing.startDate),
                endDate: dateValue(editing.endDate),
                budget: editing.budget ? String(editing.budget) : "",
              }
            }
          />
        </Card>
      )}
    </div>
  );
}
