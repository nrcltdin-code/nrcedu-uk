import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { RememberListUrl } from "@/components/dashboard/list-memory";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Universities", robots: { index: false } };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
const pageSize = 20;

export default function UniversitiesAdminPage({ searchParams }: PageProps<"/dashboard/universities">) {
  return (
    <>
      <PageHeader
        title="Universities"
        description="Universities, their courses and intakes."
        actions={
          <>
            <Link href="/dashboard/universities/import" className={buttonStyles({ variant: "glass" })}>Import CSV</Link>
            <Link href="/dashboard/universities/new" className={buttonStyles()}>Add university</Link>
          </>
        }
      />
      <Suspense fallback={<Card tone="solid">Loading universities…</Card>}>
        <UniversityList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function UniversityList({ searchParams }: Pick<PageProps<"/dashboard/universities">, "searchParams">) {
  await requirePermission("CONTENT", "edit");

  const params = await searchParams;
  const q = first(params.q).trim();
  const country = first(params.country);
  const page = Math.max(1, Number.parseInt(first(params.page) || "1", 10) || 1);

  const where: Prisma.UniversityWhereInput = {
    ...(country ? { countryId: country } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
  };
  const countryWhere: Prisma.UniversityWhereInput = country ? { countryId: country } : {};
  const [universities, total, countries, stats] = await Promise.all([
    db.university.findMany({
      where,
      orderBy: [{ sortOrder: { sort: "asc", nulls: "last" } }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, name: true, city: true, logoUrl: true, isPublished: true, isFeatured: true, isOfficialPartner: true,
        country: { select: { name: true } },
        _count: { select: { courses: true } },
      },
    }),
    db.university.count({ where }),
    db.country.findMany({ where: { universities: { some: {} } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    Promise.all([
      db.university.count({ where: countryWhere }),
      db.university.count({ where: { ...countryWhere, isPublished: true } }),
      db.university.count({ where: { ...countryWhere, isFeatured: true } }),
      db.university.count({ where: { ...countryWhere, isOfficialPartner: true } }),
      db.course.count({ where: { university: countryWhere } }),
    ]),
  ]);
  const [allCount, publishedCount, featuredCount, officialCount, courseCount] = stats;
  const countryName = countries.find((c) => c.id === country)?.name;
  const tiles = [
    { label: "Universities", value: allCount },
    { label: "On the website", value: publishedCount },
    { label: "Hidden", value: allCount - publishedCount },
    { label: "Featured", value: featuredCount },
    { label: "Official partners", value: officialCount },
    { label: "Courses", value: courseCount },
  ];
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageHref = (n: number) => `/dashboard/universities?${new URLSearchParams({ q, country, page: String(n) })}`;

  return (
    <>
      <RememberListUrl storageKey="universities-list" />
      <p className="mb-2 text-sm font-medium text-muted">{countryName ?? "All countries"}</p>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <Card key={t.label} tone="solid" className="p-4">
            <p className="text-2xl font-bold">{t.value}</p>
            <p className="text-sm text-muted">{t.label}</p>
          </Card>
        ))}
      </div>
    <Card tone="solid">
      <form key={`${q}|${country}`} className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Input name="q" defaultValue={q} placeholder="Search universities" aria-label="Search" />
        <Select name="country" defaultValue={country} aria-label="Country">
          <option value="">All countries</option>
          {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Button type="submit" variant="glass">Filter</Button>
      </form>

      <p className="mt-4 text-sm text-muted">{total} {total === 1 ? "university" : "universities"}</p>
      <ul className="mt-2 divide-y divide-brand-900/10">
        {universities.length === 0 && <li className="py-3 text-muted">No universities match.</li>}
        {universities.map((uni) => (
          <li key={uni.id}>
            <Link href={`/dashboard/universities/${uni.id}`} className="flex flex-wrap items-center gap-4 rounded-xl px-2 py-3 hover:bg-brand-600/5">
              <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-white">
                {uni.logoUrl && <Image src={uni.logoUrl} alt="" fill sizes="44px" className="object-contain p-1" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{uni.name}</span>
                <span className="block text-sm text-muted">
                  {[uni.city, uni.country.name].filter(Boolean).join(", ")} · {uni._count.courses} courses
                </span>
              </span>
              <span className="flex flex-wrap gap-2">
                {uni.isOfficialPartner && <Badge tone="accent">Official</Badge>}
                {uni.isFeatured && <Badge>Featured</Badge>}
                <Badge tone={uni.isPublished ? "success" : "neutral"}>{uni.isPublished ? "On the website" : "Hidden"}</Badge>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={pageHref(page - 1)} className={buttonStyles({ variant: "ghost", size: "sm" })}>← Previous</Link> : <span />}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link href={pageHref(page + 1)} className={buttonStyles({ variant: "ghost", size: "sm" })}>Next →</Link> : <span />}
        </div>
      )}
    </Card>
    </>
  );
}
