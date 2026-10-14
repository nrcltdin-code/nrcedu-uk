import type { Metadata } from "next";
import { Suspense } from "react";
import { RowControls } from "@/components/dashboard/form-bits";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";
import { deleteOffice, moveOffice, setOfficePublished } from "./actions";
import { OfficeForm } from "./office-form";

export const metadata: Metadata = { title: "Offices", robots: { index: false } };

export default function OfficesAdminPage({ searchParams }: PageProps<"/dashboard/offices">) {
  return (
    <>
      <PageHeader title="Offices" description="Shown on the home and contact pages: the head office first, then the order shown here." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <OfficesManager searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function OfficesManager({ searchParams }: Pick<PageProps<"/dashboard/offices">, "searchParams">) {
  await requirePermission("CONTENT", "edit");

  const { edit } = await searchParams;
  const rows = await db.office.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  const editing = rows.find((row) => row.id === edit) ?? null;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
      <ul className="grid gap-4">
        {rows.length === 0 && <Card tone="solid">No offices yet.</Card>}
        {rows.map((row, index) => (
          <li key={row.id}>
            <Card tone="solid" className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display font-bold">{row.name}</h2>
                {row.isHeadOffice && <Badge tone="accent">Head office</Badge>}
                <Badge tone={row.isPublished ? "success" : "neutral"}>{row.isPublished ? "On the website" : "Hidden"}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted">{row.city}, {row.country}</p>
              <div className="mt-3">
                <RowControls
                  editHref={`/dashboard/offices?edit=${row.id}`}
                  isPublished={row.isPublished}
                  isFirst={index === 0}
                  isLast={index === rows.length - 1}
                  toggle={setOfficePublished.bind(null, row.id, !row.isPublished)}
                  moveUp={moveOffice.bind(null, row.id, "up")}
                  moveDown={moveOffice.bind(null, row.id, "down")}
                  remove={deleteOffice.bind(null, row.id)}
                  deleteQuestion={`Delete ${row.name}?`}
                />
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Card tone="solid">
        <h2 className="mb-4 text-xl font-bold">{editing ? "Edit office" : "Add an office"}</h2>
        <OfficeForm key={editing?.id ?? "new"} office={editing} />
      </Card>
    </div>
  );
}
