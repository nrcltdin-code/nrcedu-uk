import type { Metadata } from "next";
import { Suspense } from "react";
import { RowControls } from "@/components/dashboard/form-bits";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";
import { deleteTestimonial, moveTestimonial, setTestimonialPublished } from "./actions";
import { TestimonialForm } from "./testimonial-form";

export const metadata: Metadata = { title: "Testimonials", robots: { index: false } };

export default function TestimonialsPage({ searchParams }: PageProps<"/dashboard/testimonials">) {
  return (
    <>
      <PageHeader title="Testimonials" description="Student reviews on the home page, in the order shown here. The first six are shown." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <TestimonialsManager searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function TestimonialsManager({ searchParams }: Pick<PageProps<"/dashboard/testimonials">, "searchParams">) {
  await requirePermission("CONTENT", "edit");

  const { edit } = await searchParams;
  const rows = await db.testimonial.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const editing = rows.find((row) => row.id === edit) ?? null;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
      <ul className="grid gap-4">
        {rows.length === 0 && <Card tone="solid">No testimonials yet.</Card>}
        {rows.map((row, index) => (
          <li key={row.id}>
            <Card tone="solid" className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display font-bold">{row.name}</h2>
                {row.rating && <span className="text-sm text-accent-500" aria-label={`${row.rating} stars`}>{"★".repeat(row.rating)}</span>}
                <Badge tone={row.isPublished ? "success" : "neutral"}>{row.isPublished ? "On the website" : "Hidden"}</Badge>
              </div>
              {row.headline && <p className="text-sm text-muted">{row.headline}</p>}
              <p className="mt-2 line-clamp-3 text-sm">“{row.quote}”</p>
              <div className="mt-3">
                <RowControls
                  editHref={`/dashboard/testimonials?edit=${row.id}`}
                  isPublished={row.isPublished}
                  isFirst={index === 0}
                  isLast={index === rows.length - 1}
                  toggle={setTestimonialPublished.bind(null, row.id, !row.isPublished)}
                  moveUp={moveTestimonial.bind(null, row.id, "up")}
                  moveDown={moveTestimonial.bind(null, row.id, "down")}
                  remove={deleteTestimonial.bind(null, row.id)}
                  deleteQuestion={`Delete ${row.name}'s testimonial?`}
                />
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Card tone="solid">
        <h2 className="mb-4 text-xl font-bold">{editing ? "Edit testimonial" : "Add a testimonial"}</h2>
        <TestimonialForm key={editing?.id ?? "new"} testimonial={editing} />
      </Card>
    </div>
  );
}
