import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";
import { UniversityForm } from "../forms";

export const metadata: Metadata = { title: "Add university", robots: { index: false } };

export default function NewUniversityPage() {
  return (
    <>
      <PageHeader title="Add a university" back={{ href: "/dashboard/universities", label: "Universities" }} />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <NewUniversity />
      </Suspense>
    </>
  );
}

async function NewUniversity() {
  await requirePermission("CONTENT", "edit");
  const countries = await db.country.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <Card tone="solid" className="max-w-3xl">
      <UniversityForm university={null} countries={countries} />
      <p className="mt-4 text-sm text-muted">Courses and intakes can be added once the university is saved.</p>
    </Card>
  );
}
