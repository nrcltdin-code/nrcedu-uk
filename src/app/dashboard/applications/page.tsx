import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import type { ApplicationStage, Prisma } from "@/generated/prisma/client";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requirePermission } from "@/lib/session";
import { closedStages, stageLabels, stages, stageTones } from "./labels";

export const metadata: Metadata = { title: "Applications", robots: { index: false } };

const pageSize = 25;

export default function ApplicationsPage({ searchParams }: PageProps<"/dashboard/applications">) {
  return (
    <>
      <PageHeader title="Applications" description="Every university application, by pipeline stage. Start new ones from a student's page." />
      <Suspense fallback={<Card tone="solid">Loading applications…</Card>}>
        <Pipeline searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

async function Pipeline({ searchParams }: Pick<PageProps<"/dashboard/applications">, "searchParams">) {
  const user = await requirePermission("APPLICATIONS", "view");

  const params = await searchParams;
  const stage = first(params.stage) || "open";
  const q = first(params.q).trim();
  const owner = first(params.owner);
  const page = Math.max(1, Number.parseInt(first(params.page) || "1", 10) || 1);

  const baseWhere: Prisma.ApplicationWhereInput = {
    ...(owner === "me" ? { assignedStaffId: user.id } : owner === "none" ? { assignedStaffId: null } : {}),
    ...(q
      ? {
          OR: [
            { student: { user: { name: { contains: q, mode: "insensitive" } } } },
            { student: { user: { email: { contains: q, mode: "insensitive" } } } },
            { course: { name: { contains: q, mode: "insensitive" } } },
            { course: { university: { name: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };
  const stageWhere: Prisma.ApplicationWhereInput =
    stage === "open" ? { stage: { notIn: closedStages } } : stage in stageLabels ? { stage: stage as ApplicationStage } : {};
  const where = { ...baseWhere, ...stageWhere };

  const [apps, total, counts] = await Promise.all([
    db.application.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        stage: true,
        updatedAt: true,
        student: { select: { user: { select: { name: true } } } },
        course: { select: { name: true, university: { select: { name: true } } } },
        intake: { select: { name: true } },
        assignedStaff: { select: { name: true } },
      },
    }),
    db.application.count({ where }),
    db.application.groupBy({ by: ["stage"], where: baseWhere, _count: true }),
  ]);

  const countOf = (s: ApplicationStage) => counts.find((c) => c.stage === s)?._count ?? 0;
  const tabs = [
    { value: "open", label: "Open", count: stages.filter((s) => !closedStages.includes(s)).reduce((sum, s) => sum + countOf(s), 0) },
    ...stages.map((s) => ({ value: s, label: stageLabels[s], count: countOf(s) })),
    { value: "all", label: "All", count: counts.reduce((sum, c) => sum + c._count, 0) },
  ];
  const href = (changes: Record<string, string>) =>
    `/dashboard/applications?${new URLSearchParams({ stage, q, owner, page: "1", ...changes })}`;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card tone="solid">
      <nav aria-label="Stage" className="-mx-1 flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={href({ stage: t.value })}
            aria-current={stage === t.value ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold",
              stage === t.value ? "bg-brand-600 text-white" : "text-muted hover:bg-brand-600/10",
            )}
          >
            {t.label} <span className="opacity-70">{t.count}</span>
          </Link>
        ))}
      </nav>

      <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input type="hidden" name="stage" value={stage} />
        <Input name="q" defaultValue={q} placeholder="Search student, course or university" aria-label="Search" />
        <Select name="owner" defaultValue={owner} aria-label="Handled by">
          <option value="">Anyone</option>
          <option value="me">Handled by me</option>
          <option value="none">Not assigned</option>
        </Select>
        <Button type="submit" variant="glass">Filter</Button>
      </form>

      <p className="mt-4 text-sm text-muted">{total} {total === 1 ? "application" : "applications"}</p>
      <ul className="mt-2 divide-y divide-brand-900/10">
        {apps.map((app) => (
          <li key={app.id}>
            <Link href={`/dashboard/applications/${app.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-2 py-3 hover:bg-brand-600/5">
              <span className="min-w-0">
                <span className="block font-semibold">{app.student.user.name}</span>
                <span className="block truncate text-sm text-muted">
                  {[app.course.name, app.course.university.name, app.intake?.name, `updated ${formatDate(app.updatedAt)}`].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="flex flex-wrap gap-2">
                <Badge tone="neutral">{app.assignedStaff?.name ?? "Not assigned"}</Badge>
                <Badge tone={stageTones[app.stage]}>{stageLabels[app.stage]}</Badge>
              </span>
            </Link>
          </li>
        ))}
        {apps.length === 0 && <li className="py-3 text-muted">No applications here.</li>}
      </ul>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={href({ page: String(page - 1) })} className={buttonStyles({ variant: "ghost", size: "sm" })}>← Previous</Link> : <span />}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link href={href({ page: String(page + 1) })} className={buttonStyles({ variant: "ghost", size: "sm" })}>Next →</Link> : <span />}
        </div>
      )}
    </Card>
  );
}
