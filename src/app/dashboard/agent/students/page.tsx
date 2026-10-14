import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireMyAgentId } from "@/lib/agent";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { stageLabels, stageTones } from "../../applications/labels";
import { AddStudentForm } from "../add-student-form";

export const metadata: Metadata = { title: "My students", robots: { index: false } };

export default function AgentStudentsPage() {
  return (
    <>
      <PageHeader title="My students" description="Students you referred to NRC. Add their details and documents, and apply for courses on their behalf." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <AgentStudents />
      </Suspense>
    </>
  );
}

async function AgentStudents() {
  const agentId = await requireMyAgentId();
  const [students, countries] = await Promise.all([
    db.studentProfile.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        applications: { orderBy: { updatedAt: "desc" }, take: 1, select: { stage: true, course: { select: { name: true } } } },
        _count: { select: { applications: true } },
      },
    }),
    db.country.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[1.8fr_1fr]">
      <Card tone="solid">
        <p className="text-sm text-muted">{students.length} {students.length === 1 ? "student" : "students"}</p>
        <ul className="mt-2 divide-y divide-brand-900/10">
          {students.map((s) => {
            const latest = s.applications[0];
            return (
              <li key={s.id}>
                <Link href={`/dashboard/agent/students/${s.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-2 py-3 hover:bg-brand-600/5">
                  <span className="min-w-0">
                    <span className="block font-semibold">{s.user.name}</span>
                    <span className="block truncate text-sm text-muted">
                      {[s.user.email, latest?.course.name, `added ${formatDate(s.createdAt)}`].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  {latest ? (
                    <Badge tone={stageTones[latest.stage]}>
                      {stageLabels[latest.stage]}
                      {s._count.applications > 1 && ` +${s._count.applications - 1}`}
                    </Badge>
                  ) : (
                    <Badge tone="neutral">No application yet</Badge>
                  )}
                </Link>
              </li>
            );
          })}
          {students.length === 0 && <li className="py-3 text-muted">No students yet. Add your first one.</li>}
        </ul>
      </Card>
      <Card tone="solid">
        <h2 className="mb-4 text-xl font-bold">Add a student</h2>
        <AddStudentForm countries={countries} />
      </Card>
    </div>
  );
}
