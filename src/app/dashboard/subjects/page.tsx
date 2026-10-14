import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";
import { deleteSubject } from "./actions";
import { SubjectForm } from "./subject-form";

export const metadata: Metadata = { title: "Subjects", robots: { index: false } };

export default function SubjectsPage({ searchParams }: PageProps<"/dashboard/subjects">) {
  return (
    <>
      <PageHeader title="Subjects" description="Subject areas that group courses on the website." />
      <Suspense fallback={<Card tone="solid">Loading subjects…</Card>}>
        <SubjectsManager searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SubjectsManager({ searchParams }: Pick<PageProps<"/dashboard/subjects">, "searchParams">) {
  await requirePermission("CONTENT", "edit");

  const { edit } = await searchParams;
  const subjects = await db.subject.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { courses: true } } } });
  const editing = subjects.find((subject) => subject.id === edit) ?? null;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
      <Card tone="solid" className="p-0">
        <ul className="divide-y divide-brand-900/10">
          {subjects.length === 0 && <li className="p-5 text-muted">No subjects yet.</li>}
          {subjects.map((subject) => (
            <li key={subject.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="font-semibold">{subject.name}</p>
                <p className="text-sm text-muted">/subjects/{subject.slug} · {subject._count.courses} courses</p>
              </div>
              <div className="flex items-center gap-1">
                <Link href={`/dashboard/subjects?edit=${subject.id}`} className={buttonStyles({ variant: "glass", size: "sm" })}>Edit</Link>
                <DeleteButton action={deleteSubject.bind(null, subject.id)} question={`Delete ${subject.name}? Its courses stay but lose this subject.`} />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card tone="solid">
        <h2 className="mb-4 text-xl font-bold">{editing ? "Edit subject" : "Add a subject"}</h2>
        <SubjectForm key={editing?.id ?? "new"} subject={editing} />
      </Card>
    </div>
  );
}
