import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { UniversityCard } from "@/components/site/university-card";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/field";
import { Section } from "@/components/ui/section";
import { getFilterOptions, isStudyLevel, levelNames, searchUniversities } from "@/lib/data/catalogue";

export const metadata: Metadata = {
  title: "Universities",
  description: "Search universities and courses in the UK, USA, Canada, Australia and Germany, and apply through NRC Educational Consultants.",
};

type SearchParams = PageProps<"/universities">["searchParams"];

export default function UniversitiesPage({ searchParams }: PageProps<"/universities">) {
  return (
    <main>
      <PageHero eyebrow="Universities" title="Find your" highlight="university">
        Search by name, country, subject or level, then apply online.
      </PageHero>

      <Section tint="sky">
        {/* The filters come from the address bar, which is only known when the page is requested. */}
        <Suspense fallback={<Card tone="solid">Loading universities…</Card>}>
          <Browser searchParams={searchParams} />
        </Suspense>
      </Section>

      <CtaBand title="Can't find the right university?" text="Tell us what you want to study and we will shortlist options for you." />
    </main>
  );
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

async function Browser({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = one(params.q)?.slice(0, 80);
  const country = one(params.country);
  const subject = one(params.subject);
  const levelParam = one(params.level);
  const level = levelParam && isStudyLevel(levelParam) ? levelParam : undefined;
  const page = Math.max(1, Number.parseInt(one(params.page) ?? "1", 10) || 1);

  const [options, result] = await Promise.all([
    getFilterOptions(),
    searchUniversities({ q, country, subject, level, page }),
  ]);
  const filtered = Boolean(q || country || subject || level);

  // Keeps the current filters when moving between result pages.
  function pageHref(target: number) {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (country) query.set("country", country);
    if (subject) query.set("subject", subject);
    if (level) query.set("level", level);
    if (target > 1) query.set("page", String(target));
    const text = query.toString();
    return text ? `/universities?${text}` : "/universities";
  }

  return (
    <>
      <Card className="mb-10">
        <form action="/universities" className="grid gap-4 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end">
          <div>
            <Label htmlFor="filter-q">Search</Label>
            <Input id="filter-q" name="q" type="search" defaultValue={q} placeholder="University, city or course" maxLength={80} />
          </div>
          <div>
            <Label htmlFor="filter-country">Country</Label>
            <Select id="filter-country" name="country" defaultValue={country ?? ""}>
              <option value="">All countries</option>
              {options.countries.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-subject">Subject</Label>
            <Select id="filter-subject" name="subject" defaultValue={subject ?? ""}>
              <option value="">All subjects</option>
              {options.subjects.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-level">Level</Label>
            <Select id="filter-level" name="level" defaultValue={level ?? ""}>
              <option value="">All levels</option>
              {Object.entries(levelNames).map(([value, name]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit">Search</Button>
        </form>
      </Card>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="font-medium">
          {result.total} {result.total === 1 ? "university" : "universities"} found
        </p>
        {filtered && (
          <Link href="/universities" className={buttonStyles({ variant: "ghost", size: "sm" })}>
            Clear filters
          </Link>
        )}
      </div>

      {result.universities.length === 0 ? (
        <Card className="py-12 text-center">
          <h2 className="text-xl font-bold">No universities match those filters</h2>
          <p className="mt-2 text-muted">Try a different search, or clear the filters to see everything.</p>
        </Card>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.universities.map((university) => (
            <li key={university.id}>
              <UniversityCard university={university} />
            </li>
          ))}
        </ul>
      )}

      {result.pages > 1 && (
        <nav aria-label="Result pages" className="mt-10 flex items-center justify-center gap-3">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className={buttonStyles({ variant: "glass", size: "sm" })}>
              Previous
            </Link>
          ) : null}
          <span className="text-sm text-muted">
            Page {Math.min(page, result.pages)} of {result.pages}
          </span>
          {page < result.pages ? (
            <Link href={pageHref(page + 1)} className={buttonStyles({ variant: "glass", size: "sm" })}>
              Next
            </Link>
          ) : null}
        </nav>
      )}
    </>
  );
}
