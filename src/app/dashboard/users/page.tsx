import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/dashboard/page-header";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/session";
import type { Prisma, Role, UserStatus } from "@/generated/prisma/client";
import { decideAgent } from "./actions";
import { roleLabels, statusLabels, statusTones } from "./labels";
import { NewStaffForm } from "./user-forms";

export const metadata: Metadata = { title: "Users", robots: { index: false } };

const pageSize = 25;

export default function UsersPage({ searchParams }: PageProps<"/dashboard/users">) {
  return (
    <>
      <PageHeader title="Users and roles" description="Everyone who can sign in: staff, agents and students." />
      <Suspense fallback={<Card tone="solid">Loading users…</Card>}>
        <UsersManager searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

async function UsersManager({ searchParams }: Pick<PageProps<"/dashboard/users">, "searchParams">) {
  const user = await requirePermission("USERS", "view");
  const isAdmin = user.role === "ADMIN";
  const canApprove = await can(user, "AGENTS", "edit");

  const params = await searchParams;
  const q = first(params.q).trim();
  const role = first(params.role) as Role | "";
  const status = first(params.status) as UserStatus | "";
  const page = Math.max(1, Number.parseInt(first(params.page) || "1", 10) || 1);

  const where: Prisma.UserWhereInput = {
    ...(role in roleLabels ? { role: role as Role } : {}),
    ...(status in statusLabels ? { status: status as UserStatus } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
  };

  const [users, total, pendingAgents] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    }),
    db.user.count({ where }),
    canApprove
      ? db.agentProfile.findMany({
          where: { approvalStatus: "PENDING" },
          orderBy: { createdAt: "asc" },
          select: { userId: true, companyName: true, user: { select: { name: true, email: true } }, country: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageHref = (n: number) => `/dashboard/users?${new URLSearchParams({ q, role, status, page: String(n) })}`;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
      <div className="grid min-w-0 gap-6">
        {pendingAgents.length > 0 && (
          <Card tone="solid">
            <h2 className="text-xl font-bold">Agent applications waiting ({pendingAgents.length})</h2>
            <ul className="mt-4 divide-y divide-brand-900/10">
              {pendingAgents.map((agent) => (
                <li key={agent.userId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link href={`/dashboard/users/${agent.userId}`} className="font-semibold hover:underline">
                      {agent.user.name}
                    </Link>
                    <p className="text-sm text-muted">
                      {[agent.companyName, agent.country?.name, agent.user.email].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={decideAgent.bind(null, agent.userId, "APPROVED")}>
                      <Button size="sm">Approve</Button>
                    </form>
                    <form action={decideAgent.bind(null, agent.userId, "REJECTED")}>
                      <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-500/10">Reject</Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card tone="solid">
          <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
            <Input name="q" defaultValue={q} placeholder="Search name or email" aria-label="Search" />
            <Select name="role" defaultValue={role} aria-label="Role">
              <option value="">All roles</option>
              {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
            <Select name="status" defaultValue={status} aria-label="Status">
              <option value="">Any status</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
            <Button type="submit" variant="glass">Filter</Button>
          </form>

          <p className="mt-4 text-sm text-muted">{total} {total === 1 ? "account" : "accounts"}</p>
          <ul className="mt-2 divide-y divide-brand-900/10">
            {users.map((row) => (
              <li key={row.id}>
                <Link href={`/dashboard/users/${row.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-2 py-3 hover:bg-brand-600/5">
                  <span className="min-w-0">
                    <span className="block font-semibold">{row.name}</span>
                    <span className="block truncate text-sm text-muted">{row.email}</span>
                  </span>
                  <span className="flex gap-2">
                    <Badge tone="neutral">{roleLabels[row.role]}</Badge>
                    <Badge tone={statusTones[row.status]}>{statusLabels[row.status]}</Badge>
                  </span>
                </Link>
              </li>
            ))}
            {users.length === 0 && <li className="py-3 text-muted">No accounts match.</li>}
          </ul>

          {pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              {page > 1 ? <Link href={pageHref(page - 1)} className={buttonStyles({ variant: "ghost", size: "sm" })}>← Previous</Link> : <span />}
              <span className="text-muted">Page {page} of {pages}</span>
              {page < pages ? <Link href={pageHref(page + 1)} className={buttonStyles({ variant: "ghost", size: "sm" })}>Next →</Link> : <span />}
            </div>
          )}
        </Card>
      </div>

      {isAdmin && (
        <Card tone="solid">
          <h2 className="mb-4 text-xl font-bold">Add a staff member</h2>
          <NewStaffForm />
        </Card>
      )}
    </div>
  );
}
