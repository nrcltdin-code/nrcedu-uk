import type { Metadata } from "next";
import { Suspense } from "react";
import { RowControls } from "@/components/dashboard/form-bits";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";
import { deleteFaq, moveFaq, setFaqPublished } from "./actions";
import { FaqForm } from "./faq-form";

export const metadata: Metadata = { title: "FAQs", robots: { index: false } };

export default function FaqsPage({ searchParams }: PageProps<"/dashboard/faqs">) {
  return (
    <>
      <PageHeader title="FAQs" description="Questions on the home page, in the order shown here. The first eight are shown." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <FaqsManager searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function FaqsManager({ searchParams }: Pick<PageProps<"/dashboard/faqs">, "searchParams">) {
  await requirePermission("CONTENT", "edit");

  const { edit } = await searchParams;
  const rows = await db.faq.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  const editing = rows.find((row) => row.id === edit) ?? null;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
      <ul className="grid gap-4">
        {rows.length === 0 && <Card tone="solid">No questions yet.</Card>}
        {rows.map((row, index) => (
          <li key={row.id}>
            <Card tone="solid" className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display font-bold">{row.question}</h2>
                {row.category && <Badge tone="neutral">{row.category}</Badge>}
                {!row.isPublished && <Badge tone="neutral">Hidden</Badge>}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted">{row.answer}</p>
              <div className="mt-3">
                <RowControls
                  editHref={`/dashboard/faqs?edit=${row.id}`}
                  isPublished={row.isPublished}
                  isFirst={index === 0}
                  isLast={index === rows.length - 1}
                  toggle={setFaqPublished.bind(null, row.id, !row.isPublished)}
                  moveUp={moveFaq.bind(null, row.id, "up")}
                  moveDown={moveFaq.bind(null, row.id, "down")}
                  remove={deleteFaq.bind(null, row.id)}
                  deleteQuestion="Delete this question?"
                />
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Card tone="solid">
        <h2 className="mb-4 text-xl font-bold">{editing ? "Edit question" : "Add a question"}</h2>
        <FaqForm key={editing?.id ?? "new"} faq={editing} />
      </Card>
    </div>
  );
}
