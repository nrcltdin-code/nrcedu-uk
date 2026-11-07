import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { requirePermission } from "@/lib/session";
import { ImportForm } from "./import-form";

// Large files can take a while; give the import up to a minute on the server.
export const maxDuration = 60;

export const metadata: Metadata = { title: "Import universities", robots: { index: false } };

export default function ImportUniversitiesPage() {
  return (
    <>
      <PageHeader
        title="Import universities"
        description="Add or update many universities, courses, subjects and countries from one spreadsheet."
        back={{ href: "/dashboard/universities", label: "Universities" }}
      />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <ImportCard />
      </Suspense>
    </>
  );
}

async function ImportCard() {
  await requirePermission("CONTENT", "edit");
  return (
    <Card tone="solid" className="max-w-3xl">
      <div className="mb-5 space-y-2 text-sm text-muted">
        <p>One row per course. Repeat the university details on each of its rows, or fill them on the first row only.</p>
        <p>
          Columns: <b>country</b>, <b>university</b> (required, or leave empty to add just the country), city, website, ranking, sort_order (1 shows first), description,
          min_grade_percent, university_min_ielts, min_ielts_band, max_study_gap_years, accepts_moi (yes/no),
          documents (e.g. Passport; Transcript; CV), intakes (e.g. September 2027; January 2028), process_notes,
          logo_url, cover_url, cover_credit (images are downloaded and saved to the site; universities that already have one keep it),
          subject, course, level (Foundation, Diploma, Undergraduate, Postgraduate, PhD), duration_months,
          tuition_fee, currency, min_ielts.
        </p>
        <p>
          Missing countries and subjects are created. Universities and courses that already exist (same name) are
          updated, and empty cells never erase saved details. New universities start unpublished.
        </p>
      </div>
      <ImportForm />
    </Card>
  );
}
