import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import type { Prisma } from "@/generated/prisma/client";
import { getAssigneeOptions } from "@/lib/assignees";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { can, requirePermission } from "@/lib/session";
import { closedStages } from "../applications/labels";
import { NewStudentForm } from "./student-forms";

export const metadata: Metadata = { title: "Students", robots: { index: false } };

const pageSize = 25;

export default function StudentsPage({ searchParams }: PageProps<"/dashboard/students">) {
  return (
    <>
      <PageHeader title="Students" description="Everyone NRC is helping to apply. Convert a lead or add a student directly." />
      <Suspense fallback={<Card tone="solid">Loading students…</Card>}>
        <StudentsList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

async function StudentsList({ searchParams }: Pick<PageProps<"/dashboard/students">, "searchParams">) {
  const user = await requirePermission("STUDENTS", "view");
  const canEdit = await can(user, "STUDENTS", "edit");

  const params = await searchParams;
  const q = first(params.q).trim();
  const owner = first(params.owner);
  const page = Math.max(1, Number.parseInt(first(params.page) || "1", 10) || 1);

  const where: Prisma.StudentProfileWhereInput = {
    ...(owner === "me" ? { counsellorId: user.id } : owner === "none" ? { counsellorId: null } : {}),
    ...(q
      ? {
          OR: [
            { user: { name: { contains: q, mode: "insensitive" } } },
            { user: { email: { contains: q, mode: "insensitive" } } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  const [students, total, countries, people] = await Promise.all([
    db.studentProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        country: { select: { name: true } },
        counsellor: { select: { name: true } },
        _count: { select: { applications: { where: { stage: { notIn: closedStages } } } } },
      },
    }),
    db.studentProfile.count({ where }),
    canEdit ? db.country.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }) : Promise.resolve([]),
    canEdit ? getAssigneeOptions() : Promise.resolve({ staff: [], agents: [] }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (n: number) => `/dashboard/students?${new URLSearchParams({ q, owner, page: String(n) })}`;

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[1.8fr_1fr]">
      <Card tone="solid">
        <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Input name="q" defaultValue={q} placeholder="Search name, email or phone" aria-label="Search" />
          <Select name="owner" defaultValue={owner} aria-label="Counsellor">
            <option value="">Any counsellor</option>
            <option value="me">My students</option>
            <option value="none">No counsellor</option>
          </Select>
          <Button type="submit" variant="glass">Filter</Button>
        </form>

        <p className="mt-4 text-sm text-muted">{total} {total === 1 ? "student" : "students"}</p>
        <ul className="mt-2 divide-y divide-brand-900/10">
          {students.map((s) => (
            <li key={s.id}>
              <Link href={`/dashboard/students/${s.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-2 py-3 hover:bg-brand-600/5">
                <span className="min-w-0">
                  <span className="block font-semibold">{s.user.name}</span>
                  <span className="block truncate text-sm text-muted">
                    {[s.user.email, s.country?.name, `added ${formatDate(s.createdAt)}`].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="flex flex-wrap gap-2">
                  <Badge tone="neutral">{s.counsellor?.name ?? "No counsellor"}</Badge>
                  <Badge tone={s._count.applications ? "brand" : "neutral"}>
                    {s._count.applications} open {s._count.applications === 1 ? "application" : "applications"}
                  </Badge>
                </span>
              </Link>
            </li>
          ))}
          {students.length === 0 && <li className="py-3 text-muted">No students match.</li>}
        </ul>

        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            {page > 1 ? <Link href={href(page - 1)} className={buttonStyles({ variant: "ghost", size: "sm" })}>← Previous</Link> : <span />}
            <span className="text-muted">Page {page} of {pages}</span>
            {page < pages ? <Link href={href(page + 1)} className={buttonStyles({ variant: "ghost", size: "sm" })}>Next →</Link> : <span />}
          </div>
        )}
      </Card>

      {canEdit && (
        <Card tone="solid">
          <h2 className="mb-4 text-xl font-bold">Add a student</h2>
          <NewStudentForm countries={countries} counsellors={people.staff} agents={people.agents} />
        </Card>
      )}
    </div>
  );
}
