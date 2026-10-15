import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireAgentOwner } from "@/lib/agent";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { commissionStatusLabels, commissionStatusTones } from "../../commissions/labels";

export const metadata: Metadata = { title: "My commission", robots: { index: false } };

export default function AgentCommissionsPage() {
  return (
    <>
      <PageHeader title="My commission" description="What NRC owes you for students who enrolled. Amounts are confirmed once the university pays NRC." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <AgentCommissions />
      </Suspense>
    </>
  );
}

async function AgentCommissions() {
  const { agentId } = await requireAgentOwner();
  // Only payouts to this agent. What the university pays NRC is never shown to agents.
  const rows = await db.commission.findMany({
    where: { agentId, direction: "NRC_TO_AGENT" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      settledAt: true,
      createdAt: true,
      application: { select: { student: { select: { user: { select: { name: true } } } }, course: { select: { name: true, university: { select: { name: true } } } } } },
    },
  });

  // Totals per currency, since students study in different countries.
  const totals = new Map<string, { pending: number; paid: number }>();
  for (const row of rows) {
    const t = totals.get(row.currency) ?? { pending: 0, paid: 0 };
    if (row.status === "PENDING") t.pending += Number(row.amount);
    if (row.status === "SETTLED") t.paid += Number(row.amount);
    totals.set(row.currency, t);
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card tone="solid">
          <p className="text-sm text-muted">Due to you</p>
          <p className="font-display text-2xl font-bold">
            {[...totals].map(([currency, t]) => formatMoney(t.pending, currency)).join(" + ") || formatMoney(0, "GBP")}
          </p>
        </Card>
        <Card tone="solid">
          <p className="text-sm text-muted">Paid to you</p>
          <p className="font-display text-2xl font-bold">
            {[...totals].map(([currency, t]) => formatMoney(t.paid, currency)).join(" + ") || formatMoney(0, "GBP")}
          </p>
        </Card>
      </div>
      <Card tone="solid">
        <ul className="divide-y divide-brand-900/10">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span className="min-w-0">
                <span className="block font-semibold">{row.application.student.user.name}</span>
                <span className="block text-sm text-muted">
                  {row.application.course.name}, {row.application.course.university.name}
                  {row.settledAt && ` · paid ${formatDate(row.settledAt)}`}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="font-semibold">{formatMoney(Number(row.amount), row.currency)}</span>
                <Badge tone={commissionStatusTones[row.status]}>{commissionStatusLabels.NRC_TO_AGENT[row.status]}</Badge>
              </span>
            </li>
          ))}
          {rows.length === 0 && <li className="py-2 text-muted">Nothing yet. Commission is added when one of your students enrols.</li>}
        </ul>
      </Card>
    </div>
  );
}
