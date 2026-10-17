import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";
import { parseFacts, parseTables } from "@/lib/test-prep";
import { deleteTestPrep } from "./actions";
import { TestPrepForm } from "./test-prep-form";

export const metadata: Metadata = { title: "Test prep", robots: { index: false } };

export default function TestPrepAdminPage({ searchParams }: PageProps<"/dashboard/test-prep">) {
  return (
    <>
      <PageHeader title="Test prep" description="Exam guides on the website (IELTS, PTE, GRE…). Published ones appear in the Test Prep menu, in the order set here." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <TestPrepAdmin searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function TestPrepAdmin({ searchParams }: Pick<PageProps<"/dashboard/test-prep">, "searchParams">) {
  await requirePermission("CONTENT", "edit");
  const { edit } = await searchParams;
  const tests = await db.testPrepPage.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  const editing = tests.find((t) => t.id === edit) ?? null;
  const showForm = edit === "new" || editing !== null;

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[1fr_1.6fr]">
      <div className="grid gap-4">
        <Link href="/dashboard/test-prep?edit=new" className={buttonStyles({ size: "sm", className: "justify-self-start" })}>Add a test</Link>
        <Card tone="solid" className="p-0">
          <ul className="divide-y divide-brand-900/10">
            {tests.map((t) => (
              <li key={t.id} className={`flex flex-wrap items-center justify-between gap-2 px-5 py-3 ${t.id === edit ? "bg-brand-600/8" : ""}`}>
                <span className="min-w-0">
                  <span className="block font-semibold">{t.name}</span>
                  <span className="block text-xs text-muted">/test-prep/{t.slug} · {parseTables(t.tables).length} tables</span>
                </span>
                <span className="flex items-center gap-1">
                  {!t.isPublished && <Badge tone="neutral">Hidden</Badge>}
                  <Link href={`/dashboard/test-prep?edit=${t.id}`} className={buttonStyles({ variant: "glass", size: "sm" })}>Edit</Link>
                  <DeleteButton action={deleteTestPrep.bind(null, t.id)} question={`Delete the ${t.name} guide?`} />
                </span>
              </li>
            ))}
            {tests.length === 0 && <li className="p-5 text-muted">No tests yet.</li>}
          </ul>
        </Card>
      </div>
      {showForm && (
        <Card tone="solid">
          <h2 className="mb-4 text-xl font-bold">{editing ? `Edit ${editing.name}` : "Add a test"}</h2>
          <TestPrepForm
            key={editing?.id ?? "new"}
            test={editing && {
              id: editing.id,
              name: editing.name,
              slug: editing.slug,
              summary: editing.summary ?? "",
              content: editing.content ?? "",
              sortOrder: editing.sortOrder,
              isPublished: editing.isPublished,
              facts: parseFacts(editing.facts),
              tables: parseTables(editing.tables),
            }}
          />
          {editing?.isPublished && <Link href={`/test-prep/${editing.slug}`} target="_blank" className="mt-4 inline-block text-sm text-brand-700 hover:underline">View on the website ↗</Link>}
        </Card>
      )}
    </div>
  );
}
