import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import type { LeadStatus, Prisma } from "@/generated/prisma/client";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { can, requirePermission } from "@/lib/session";
import { leadSourceLabels, leadStatuses, leadStatusLabels, leadStatusTones } from "./labels";
import { NewLeadForm } from "./lead-forms";

export const metadata: Metadata = { title: "Leads", robots: { index: false } };

const pageSize = 25;
const openStatuses: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED"];

export default function LeadsPage({ searchParams }: PageProps<"/dashboard/leads">) {
  return (
    <>
      <PageHeader title="Leads" description="Enquiries from the consultation and contact forms, and leads added by staff." />
      <Suspense fallback={<Card tone="solid">Loading leads…</Card>}>
        <LeadsInbox searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

async function LeadsInbox({ searchParams }: Pick<PageProps<"/dashboard/leads">, "searchParams">) {
  const user = await requirePermission("LEADS", "view");
  const canEdit = await can(user, "LEADS", "edit");

  const params = await searchParams;
  const tab = first(params.tab) || "open";
  const q = first(params.q).trim();
  const owner = first(params.owner);
  const page = Math.max(1, Number.parseInt(first(params.page) || "1", 10) || 1);

  const statusFilter: Prisma.LeadWhereInput =
    tab === "open" ? { status: { in: openStatuses } } : tab in leadStatusLabels ? { status: tab as LeadStatus } : {};
  const baseWhere: Prisma.LeadWhereInput = {
    ...(owner === "me" ? { assignedStaffId: user.id } : owner === "none" ? { assignedStaffId: null, assignedAgentId: null } : {}),
    ...(q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] }
      : {}),
  };
  const where = { ...baseWhere, ...statusFilter };

  const [leads, total, counts, countries] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        source: true,
        createdAt: true,
        destination: { select: { name: true } },
        assignedStaff: { select: { name: true } },
        assignedAgent: { select: { user: { select: { name: true } } } },
      },
    }),
    db.lead.count({ where }),
    db.lead.groupBy({ by: ["status"], where: baseWhere, _count: true }),
    canEdit ? db.country.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }) : Promise.resolve([]),
  ]);

  const countOf = (status: LeadStatus) => counts.find((c) => c.status === status)?._count ?? 0;
  const tabs = [
    { value: "open", label: "Open", count: openStatuses.reduce((sum, s) => sum + countOf(s), 0) },
    ...leadStatuses.map((s) => ({ value: s, label: leadStatusLabels[s], count: countOf(s) })),
    { value: "all", label: "All", count: counts.reduce((sum, c) => sum + c._count, 0) },
  ];
  const href = (changes: Record<string, string>) =>
    `/dashboard/leads?${new URLSearchParams({ tab, q, owner, page: "1", ...changes })}`;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[1.8fr_1fr]">
      <Card tone="solid">
        <nav aria-label="Lead status" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <Link
              key={t.value}
              href={href({ tab: t.value })}
              aria-current={tab === t.value ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold",
                tab === t.value ? "bg-brand-600 text-white" : "text-muted hover:bg-brand-600/10",
              )}
            >
              {t.label} <span className="opacity-70">{t.count}</span>
            </Link>
          ))}
        </nav>

        <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input type="hidden" name="tab" value={tab} />
          <Input name="q" defaultValue={q} placeholder="Search name, email or phone" aria-label="Search" />
          <Select name="owner" defaultValue={owner} aria-label="Assigned to">
            <option value="">Anyone</option>
            <option value="me">Assigned to me</option>
            <option value="none">Not assigned</option>
          </Select>
          <Button type="submit" variant="glass">Filter</Button>
        </form>

        <p className="mt-4 text-sm text-muted">{total} {total === 1 ? "lead" : "leads"}</p>
        <ul className="mt-2 divide-y divide-brand-900/10">
          {leads.map((lead) => {
            const assignee = lead.assignedStaff?.name ?? lead.assignedAgent?.user.name;
            return (
              <li key={lead.id}>
                <Link href={`/dashboard/leads/${lead.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-2 py-3 hover:bg-brand-600/5">
                  <span className="min-w-0">
                    <span className="block font-semibold">{lead.name}</span>
                    <span className="block truncate text-sm text-muted">
                      {[lead.email, lead.destination?.name, leadSourceLabels[lead.source], formatDate(lead.createdAt)].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-2">
                    <Badge tone="neutral">{assignee ?? "Not assigned"}</Badge>
                    <Badge tone={leadStatusTones[lead.status]}>{leadStatusLabels[lead.status]}</Badge>
                  </span>
                </Link>
              </li>
            );
          })}
          {leads.length === 0 && <li className="py-3 text-muted">No leads here.</li>}
        </ul>

        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            {page > 1 ? <Link href={href({ page: String(page - 1) })} className={buttonStyles({ variant: "ghost", size: "sm" })}>← Previous</Link> : <span />}
            <span className="text-muted">Page {page} of {pages}</span>
            {page < pages ? <Link href={href({ page: String(page + 1) })} className={buttonStyles({ variant: "ghost", size: "sm" })}>Next →</Link> : <span />}
          </div>
        )}
      </Card>

      {canEdit && (
        <div className="grid gap-6">
          <Card tone="solid">
            <h2 className="mb-4 text-xl font-bold">Add a lead</h2>
            <NewLeadForm countries={countries} />
          </Card>
          {user.role === "ADMIN" && (
            <Card tone="solid">
              <h2 className="text-lg font-bold">Lead routing</h2>
              <p className="mt-1 text-sm text-muted">Choose who gets new leads from each country automatically.</p>
              <Link href="/dashboard/leads/routing" className={buttonStyles({ variant: "glass", size: "sm", className: "mt-3" })}>
                Set up routing
              </Link>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
