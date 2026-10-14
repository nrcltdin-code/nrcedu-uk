import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";
import { RoutingForm } from "../lead-forms";
import { getAssigneeOptions } from "@/lib/assignees";

export const metadata: Metadata = { title: "Lead routing", robots: { index: false } };

export default function RoutingPage() {
  return (
    <>
      <PageHeader
        title="Lead routing"
        back={{ href: "/dashboard/leads", label: "Leads" }}
        description="New leads are assigned automatically by the country the person lives in. Leads from countries not listed stay unassigned."
      />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <Routing />
      </Suspense>
    </>
  );
}

async function Routing() {
  const user = await requirePermission("LEADS", "edit");
  if (user.role !== "ADMIN") redirect("/dashboard/leads");

  // Countries leads actually come from, plus any already routed; the full list of 197 would be noise.
  const [options, assignments, leadCountries] = await Promise.all([
    getAssigneeOptions(),
    db.countryAssignment.findMany(),
    db.lead.groupBy({ by: ["countryId"], where: { countryId: { not: null } }, _count: true }),
  ]);
  const ids = new Set([...assignments.map((a) => a.countryId), ...leadCountries.map((l) => l.countryId!)]);
  const [listed, all] = await Promise.all([
    db.country.findMany({ where: { OR: [{ id: { in: [...ids] } }, { isDestination: true }] }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.country.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const listedIds = new Set(listed.map((c) => c.id));

  return (
    <Card tone="solid" className="grid gap-4">
      <div className="hidden gap-3 text-xs font-semibold uppercase tracking-wider text-muted sm:grid sm:grid-cols-[10rem_1fr_1fr_auto]">
        <span>Country</span>
        <span>Counsellor</span>
        <span>Agent</span>
        <span className="w-16" />
      </div>
      {listed.map((country) => {
        const current = assignments.find((a) => a.countryId === country.id);
        return (
          <RoutingForm
            key={country.id}
            country={country}
            staffId={current?.staffId ?? null}
            agentId={current?.agentId ?? null}
            staff={options.staff}
            agents={options.agents}
          />
        );
      })}
      <div className="border-t border-brand-900/10 pt-4">
        <h2 className="mb-3 text-sm font-semibold">Add another country</h2>
        <RoutingForm
          key={listed.length}
          country={null}
          countries={all.filter((c) => !listedIds.has(c.id))}
          staffId={null}
          agentId={null}
          staff={options.staff}
          agents={options.agents}
        />
      </div>
    </Card>
  );
}
