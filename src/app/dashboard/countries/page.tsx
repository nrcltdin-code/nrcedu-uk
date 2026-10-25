import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { addDestination, deleteCountryPage } from "./actions";
import { CountryForm } from "./country-form";

// Only countries with a page (or page content) get a Delete button.
const hasPage = (c: { isDestination: boolean; description: string | null; tagline: string | null; content: string | null; imageUrl: string | null }) =>
  c.isDestination || Boolean(c.description || c.tagline || c.content || c.imageUrl);

export const metadata: Metadata = { title: "Countries", robots: { index: false } };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default function CountriesPage({ searchParams }: PageProps<"/dashboard/countries">) {
  return (
    <>
      <PageHeader title="Countries" description="Add study destinations and write their pages." />
      <Suspense fallback={<Card tone="solid">Loading countries…</Card>}>
        <CountriesManager searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function CountriesManager({ searchParams }: Pick<PageProps<"/dashboard/countries">, "searchParams">) {
  await requirePermission("CONTENT", "edit");

  const params = await searchParams;
  const edit = first(params.edit);

  // The list shows destinations only; any other country is added from the dropdown.
  const [countries, others, editing] = await Promise.all([
    db.country.findMany({ where: { isDestination: true }, orderBy: { name: "asc" }, include: { _count: { select: { universities: true } } } }),
    db.country.findMany({ where: { isDestination: false }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    // Only destinations open in the editor, so an old ?edit= link to a removed one shows nothing.
    edit ? db.country.findFirst({ where: { id: edit, isDestination: true } }) : null,
  ]);
  const link = (id: string) => `/dashboard/countries?${new URLSearchParams({ edit: id })}`;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
      <Card tone="solid">
        <form action={addDestination} className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Select name="id" required defaultValue="" aria-label="Add a destination">
            <option value="" disabled>Add a destination…</option>
            {others.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <SaveButton>Add</SaveButton>
        </form>
        <ul className="mt-4 divide-y divide-brand-900/10">
          {countries.length === 0 && <li className="py-3 text-muted">No destinations yet. Add one above.</li>}
          {countries.map((country) => (
            <li key={country.id} className="flex items-center gap-1">
              <Link
                href={link(country.id)}
                className={`flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl px-2 py-2.5 hover:bg-brand-600/5 ${country.id === edit ? "bg-brand-600/8" : ""}`}
              >
                <span className="font-medium">{country.name}</span>
                <span className="flex gap-2">
                  {country._count.universities > 0 && <Badge tone="neutral">{country._count.universities} universities</Badge>}
                  {country.isDestination && <Badge tone="success">Destination</Badge>}
                </span>
              </Link>
              {hasPage(country) && (
                <DeleteButton action={deleteCountryPage.bind(null, country.id)} question={`Delete the ${country.name} page? Its text and images are removed and it leaves the Destinations menu.`} />
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card tone="solid">
        {editing ? (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">{editing.name}</h2>
              {hasPage(editing) && (
                <DeleteButton action={deleteCountryPage.bind(null, editing.id)} question={`Delete the ${editing.name} page? Its text and images are removed and it leaves the Destinations menu.`} />
              )}
            </div>
            <CountryForm key={editing.id} country={editing} />
          </>
        ) : (
          <p className="text-muted">Choose a country to edit it.</p>
        )}
      </Card>
    </div>
  );
}
