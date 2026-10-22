import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/field";
import { courseLevelNames, isStudyLevel, levelNames } from "@/lib/data/catalogue";
import { db } from "@/lib/db";
import { findCourses } from "@/lib/course-finder";
import type { FinderFilters, FinderResult } from "@/lib/course-finder";
import type { MatchStatus, StudentFacts } from "@/lib/course-match";

const statusText: Record<MatchStatus, { title: string; badge: string; tone: "success" | "accent" | "danger" }> = {
  ELIGIBLE: { title: "Meets the requirements", badge: "Eligible", tone: "success" },
  CONDITIONAL: { title: "Possible, with conditions or missing details", badge: "Conditional", tone: "accent" },
  NOT_ELIGIBLE: { title: "Does not meet the requirements", badge: "Not eligible", tone: "danger" },
};

const statusRank: Record<MatchStatus, number> = { ELIGIBLE: 0, CONDITIONAL: 1, NOT_ELIGIBLE: 2 };

type Search = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => (typeof value === "string" ? value.trim() : "");

export function readFilters(search: Search): FinderFilters {
  const level = one(search.level);
  const maxFee = Number(one(search.maxFee));
  return {
    countryId: one(search.country) || undefined,
    subjectId: one(search.subject) || undefined,
    level: level && isStudyLevel(level) ? level : undefined,
    maxFee: Number.isFinite(maxFee) && maxFee > 0 ? maxFee : undefined,
    q: one(search.q).slice(0, 100) || undefined,
  };
}

// Filters and grouped results. applyHref decides where "Apply" goes for staff or students.
export async function CourseFinder({ facts, filters, publishedOnly, applyHref, selectAction, showHidden }: {
  facts: StudentFacts;
  filters: FinderFilters;
  publishedOnly: boolean;
  applyHref: (courseId: string) => string;
  // When set, courses get tick boxes and the chosen ones are sent here as ?c=…&c=….
  selectAction?: string;
  showHidden?: boolean;
}) {
  const [results, countries, subjects] = await Promise.all([
    findCourses(facts, filters, publishedOnly),
    db.country.findMany({ where: { isDestination: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.subject.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const missing = facts.education.length === 0 || facts.scores.length === 0;
  const universities = groupByUniversity(results);

  return (
    <div className="grid gap-6">
      <Card tone="solid">
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" method="get">
          <div>
            <Label htmlFor="f-country">Country</Label>
            <Select id="f-country" name="country" defaultValue={filters.countryId ?? ""}>
              <option value="">Any</option>
              {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="f-level">Level</Label>
            <Select id="f-level" name="level" defaultValue={filters.level ?? ""}>
              <option value="">Any</option>
              {courseLevelNames.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="f-subject">Subject</Label>
            <Select id="f-subject" name="subject" defaultValue={filters.subjectId ?? ""}>
              <option value="">Any</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="f-fee">Max tuition per year</Label>
            <Input id="f-fee" name="maxFee" type="number" min={0} step={500} defaultValue={filters.maxFee ?? ""} placeholder="Any" />
          </div>
          <div>
            <Label htmlFor="f-q">Course name</Label>
            <Input id="f-q" name="q" defaultValue={filters.q ?? ""} placeholder="e.g. Computing" />
          </div>
          <Button type="submit" size="sm" className="justify-self-start">Find courses</Button>
        </form>
        {missing && (
          <p className="mt-4 rounded-xl border border-accent-500/30 bg-accent-500/10 px-4 py-2.5 text-sm">
            Add education results and an English test score for more accurate matches. Until then, most courses show as conditional.
          </p>
        )}
      </Card>

      {results.length === 0 && <Card tone="solid"><p className="text-muted">No courses match these filters.</p></Card>}

      {selectAction && results.length > 0 ? (
        <form action={selectAction} method="get" className="grid gap-6">
          <UniversityGroups universities={universities} applyHref={applyHref} selectable />
          <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-900/10 bg-white/90 p-3 shadow-lg backdrop-blur">
            <p className="text-sm">Tick one or more courses, then set up an application for each.</p>
            <Button type="submit">Apply to selected</Button>
          </div>
        </form>
      ) : (
        <UniversityGroups universities={universities} applyHref={applyHref} />
      )}
      {showHidden && <p className="text-xs text-muted">Staff view: courses hidden from the website are included.</p>}
      {results.length === 500 && <p className="text-xs text-muted">Showing the first 500 courses. Narrow the filters to see others.</p>}
    </div>
  );
}

type UniversityGroup = { id: string; name: string; country: string; best: MatchStatus; courses: FinderResult[] };

// Results grouped by university, best universities first.
function groupByUniversity(results: FinderResult[]): UniversityGroup[] {
  const map = new Map<string, UniversityGroup>();
  for (const r of results) {
    const group = map.get(r.university.id) ?? { id: r.university.id, name: r.university.name, country: r.university.country, best: r.status, courses: [] };
    group.courses.push(r);
    if (statusRank[r.status] < statusRank[group.best]) group.best = r.status;
    map.set(r.university.id, group);
  }
  return [...map.values()].sort((a, b) => statusRank[a.best] - statusRank[b.best]);
}

function UniversityGroups({ universities, applyHref, selectable }: { universities: UniversityGroup[]; applyHref: (courseId: string) => string; selectable?: boolean }) {
  return (
    <>
      {universities.map((uni) => (
        <Card key={uni.id} tone="solid" className="p-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-brand-900/10 px-4 py-3">
            <h2 className="text-lg font-bold">{uni.name}</h2>
            <p className="text-sm text-muted">{uni.country} · {uni.courses.length} course{uni.courses.length === 1 ? "" : "s"}</p>
          </div>
          <ul className="divide-y divide-brand-900/10">
            {uni.courses.map((course) => (
              <li key={course.id} className="flex items-start gap-3 p-4">
                {selectable && (
                  <input type="checkbox" name="c" value={course.id} id={`pick-${course.id}`} className="mt-1 size-4 shrink-0 accent-brand-600" aria-label={`Select ${course.name}`} />
                )}
                <div className="min-w-0 flex-1">
                  <label htmlFor={selectable ? `pick-${course.id}` : undefined} className="font-semibold">
                    {course.name} <Badge tone={statusText[course.status].tone}>{statusText[course.status].badge}</Badge>
                  </label>
                  <p className="text-sm text-muted">
                    {[levelNames[course.level], course.tuitionFee && `${course.currency} ${Number(course.tuitionFee).toLocaleString("en-GB")} a year`].filter(Boolean).join(" · ")}
                  </p>
                  {course.checks.some((c) => c.status !== "ELIGIBLE") && (
                    <ul className="mt-2 grid gap-0.5 text-sm">
                      {course.checks.filter((c) => c.status !== "ELIGIBLE").map((c) => (
                        <li key={c.label}><span className="font-semibold">{c.label}:</span> {c.detail}</li>
                      ))}
                    </ul>
                  )}
                </div>
                {!selectable && course.status !== "NOT_ELIGIBLE" && (
                  <Link href={applyHref(course.id)} className={buttonStyles({ size: "sm", variant: "glass" })}>Apply</Link>
                )}
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </>
  );
}
