import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Prisma } from "@/generated/prisma/client";
import { closedStages, stageLabel, stageTones } from "@/lib/application-flow";
import { requireAgentScope } from "@/lib/agent";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Applications", robots: { index: false } };

const tabs = [
  { value: "open", label: "In progress" },
  { value: "ENROLLED", label: "Enrolled" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
] as const;

export default function AgentApplicationsPage({ searchParams }: PageProps<"/dashboard/agent/applications">) {
  return (
    <>
      <PageHeader title="Applications" description="Applications your agency started. NRC moves each one through the stages and tells you what is needed." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <AgentApplications searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function AgentApplications({ searchParams }: Pick<PageProps<"/dashboard/agent/applications">, "searchParams">) {
  const scope = await requireAgentScope();
  const { status: raw } = await searchParams;
  const status = tabs.find((t) => t.value === raw)?.value ?? "open";
  const filter: Prisma.ApplicationWhereInput =
    status === "open" ? { stage: { notIn: closedStages } } : status === "ENROLLED" ? { stage: "ENROLLED" } : status === "closed" ? { stage: { in: closedStages.filter((s) => s !== "ENROLLED") } } : {};

  const applications = await db.application.findMany({
    where: { ...scope.applications, ...filter },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      stage: true,
      updatedAt: true,
      student: { select: { user: { select: { name: true } } } },
      submittedBy: { select: { id: true, name: true } },
      course: { select: { name: true, university: { select: { name: true, confirmationName: true } } } },
      intake: { select: { name: true } },
      _count: { select: { documentRequests: { where: { status: { in: ["REQUESTED", "NEEDS_REUPLOAD"] } } } } },
    },
  });

  return (
    <>
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Filter">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={`/dashboard/agent/applications?status=${t.value}`}
            aria-current={status === t.value ? "page" : undefined}
            className={status === t.value ? "rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white" : "glass rounded-full px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-white/75"}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <Card tone="solid" className="p-0">
        <ul className="divide-y divide-brand-900/10">
          {applications.map((a) => (
            <li key={a.id}>
              <Link href={`/dashboard/agent/applications/${a.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 hover:bg-brand-600/5">
                <span className="min-w-0">
                  <span className="block font-semibold">{a.student.user.name} · {a.course.name}</span>
                  <span className="block truncate text-sm text-muted">
                    {[a.course.university.name, a.intake?.name, `updated ${formatDate(a.updatedAt)}`, a.submittedBy && scope.can("ALL_STUDENTS") ? `by ${a.submittedBy.id === scope.userId ? "you" : a.submittedBy.name}` : null].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  {a._count.documentRequests > 0 && <Badge tone="danger">{a._count.documentRequests} to upload</Badge>}
                  <Badge tone={stageTones[a.stage]}>{stageLabel(a.stage, a.course.university.confirmationName)}</Badge>
                </span>
              </Link>
            </li>
          ))}
          {applications.length === 0 && <li className="p-5 text-muted">No applications here.</li>}
        </ul>
      </Card>
    </>
  );
}
