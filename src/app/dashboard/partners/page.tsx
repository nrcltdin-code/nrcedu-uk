import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import { RowControls } from "@/components/dashboard/form-bits";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";
import { deletePartner, movePartner, setPartnerPublished } from "./actions";
import { PartnerForm } from "./partner-form";

export const metadata: Metadata = { title: "Partners", robots: { index: false } };

export default function PartnersAdminPage({ searchParams }: PageProps<"/dashboard/partners">) {
  return (
    <>
      <PageHeader
        title="Partners"
        description="Logos in the partners strip on the home page. Official partner universities are marked on each university instead."
      />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <PartnersManager searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function PartnersManager({ searchParams }: Pick<PageProps<"/dashboard/partners">, "searchParams">) {
  await requirePermission("CONTENT", "edit");

  const { edit } = await searchParams;
  const rows = await db.partner.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  const editing = rows.find((row) => row.id === edit) ?? null;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
      <ul className="grid gap-4">
        {rows.length === 0 && <Card tone="solid">No partners yet.</Card>}
        {rows.map((row, index) => (
          <li key={row.id}>
            <Card tone="solid" className="flex flex-wrap items-center gap-4 p-4">
              <span className="relative h-12 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
                {row.logoUrl && <Image src={row.logoUrl} alt="" fill sizes="80px" className="object-contain p-1.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display font-bold">{row.name}</h2>
                  <Badge tone={row.isPublished ? "success" : "neutral"}>{row.isPublished ? "On the website" : "Hidden"}</Badge>
                </div>
                <div className="mt-2">
                  <RowControls
                    editHref={`/dashboard/partners?edit=${row.id}`}
                    isPublished={row.isPublished}
                    isFirst={index === 0}
                    isLast={index === rows.length - 1}
                    toggle={setPartnerPublished.bind(null, row.id, !row.isPublished)}
                    moveUp={movePartner.bind(null, row.id, "up")}
                    moveDown={movePartner.bind(null, row.id, "down")}
                    remove={deletePartner.bind(null, row.id)}
                    deleteQuestion={`Delete ${row.name}?`}
                  />
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Card tone="solid">
        <h2 className="mb-4 text-xl font-bold">{editing ? "Edit partner" : "Add a partner"}</h2>
        <PartnerForm key={editing?.id ?? "new"} partner={editing} />
      </Card>
    </div>
  );
}
