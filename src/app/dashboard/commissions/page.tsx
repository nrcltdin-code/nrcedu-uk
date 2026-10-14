import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ExportLink } from "@/components/dashboard/export-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CommissionDirection, CommissionStatus, Prisma } from "@/generated/prisma/client";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { requirePermission } from "@/lib/session";
import { commissionStatusLabels, commissionStatusTones, directionLabels } from "./labels";

export const metadata: Metadata = { title: "Commission", robots: { index: false } };

const pageSize = 50;

export default function CommissionsPage({ searchParams }: PageProps<"/dashboard/commissions">) {
  return (
    <>
      <PageHeader title="Commission" description="Money universities owe NRC, and money NRC owes its agents. Amounts are added and settled from each application's page." actions={<ExportLink kind="commissions" />} />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <Commissions searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

async function Commissions({ searchParams }: Pick<PageProps<"/dashboard/commissions">, "searchParams">) {
  await requirePermission("COMMISSIONS", "view");

  const params = await searchParams;
  const direction = (first(params.direction) || "UNIVERSITY_TO_NRC") as CommissionDirection;
  const status = (first(params.status) || "PENDING") as CommissionStatus | "all";
  const page = Math.max(1, Number.parseInt(first(params.page) || "1", 10) || 1);
  if (!(direction in directionLabels)) return null;

  const where: Prisma.CommissionWhereInput = { direction, ...(status !== "all" ? { status } : {}) };
  const [rows, total, sums] = await Promise.all([
    db.commission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        applicationId: true,
        agent: { select: { companyName: true, user: { select: { name: true } } } },
        application: { select: { student: { select: { user: { select: { name: true } } } }, course: { select: { name: true, university: { select: { name: true } } } } } },
      },
    }),
    db.commission.count({ where }),
    db.commission.groupBy({ by: ["status", "currency"], where: { direction }, _sum: { amount: true } }),
  ]);

  const sumFor = (s: CommissionStatus) =>
    sums
      .filter((row) => row.status === s)
      .map((row) => formatMoney(Number(row._sum.amount ?? 0), row.currency))
      .join(" + ") || formatMoney(0, "GBP");
  const href = (changes: Record<string, string>) =>
    `/dashboard/commissions?${new URLSearchParams({ direction, status, page: "1", ...changes })}`;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pill = (active: boolean) =>
    cn("shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold", active ? "bg-brand-600 text-white" : "text-muted hover:bg-brand-600/10");

  return (
    <div className="grid gap-6">
      <nav aria-label="Direction" className="flex flex-wrap gap-2">
        {(Object.keys(directionLabels) as CommissionDirection[]).map((d) => (
          <Link key={d} href={href({ direction: d })} className={pill(direction === d)} aria-current={direction === d ? "page" : undefined}>
            {directionLabels[d]}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card tone="solid">
          <p className="text-sm text-muted">{commissionStatusLabels[direction].PENDING}</p>
          <p className="font-display text-2xl font-bold">{sumFor("PENDING")}</p>
        </Card>
        <Card tone="solid">
          <p className="text-sm text-muted">{commissionStatusLabels[direction].SETTLED}</p>
          <p className="font-display text-2xl font-bold">{sumFor("SETTLED")}</p>
        </Card>
      </div>

      <Card tone="solid">
        <nav aria-label="Status" className="flex flex-wrap gap-1">
          {(["PENDING", "SETTLED", "CANCELLED", "all"] as const).map((s) => (
            <Link key={s} href={href({ status: s })} className={pill(status === s)}>
              {s === "all" ? "All" : commissionStatusLabels[direction][s]}
            </Link>
          ))}
        </nav>
        <ul className="mt-4 divide-y divide-brand-900/10">
          {rows.map((row) => (
            <li key={row.id}>
              <Link href={`/dashboard/applications/${row.applicationId}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-2 py-3 hover:bg-brand-600/5">
                <span className="min-w-0">
                  <span className="block font-semibold">{row.application.student.user.name}</span>
                  <span className="block truncate text-sm text-muted">
                    {[row.application.course.name, row.application.course.university.name, row.agent && `agent: ${row.agent.companyName ?? row.agent.user.name}`].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-semibold">{formatMoney(Number(row.amount), row.currency)}</span>
                  <Badge tone={commissionStatusTones[row.status]}>{commissionStatusLabels[direction][row.status]}</Badge>
                </span>
              </Link>
            </li>
          ))}
          {rows.length === 0 && <li className="py-3 text-muted">Nothing here.</li>}
        </ul>
        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            {page > 1 ? <Link href={href({ page: String(page - 1) })} className={buttonStyles({ variant: "ghost", size: "sm" })}>← Previous</Link> : <span />}
            <span className="text-muted">Page {page} of {pages}</span>
            {page < pages ? <Link href={href({ page: String(page + 1) })} className={buttonStyles({ variant: "ghost", size: "sm" })}>Next →</Link> : <span />}
          </div>
        )}
      </Card>
    </div>
  );
}
