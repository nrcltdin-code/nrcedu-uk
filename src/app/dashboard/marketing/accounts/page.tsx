import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/session";
import { deleteSocialAccount } from "../actions";
import { RevealPassword, SocialAccountForm } from "../forms";
import { platformLabels } from "../labels";

export const metadata: Metadata = { title: "Social pages", robots: { index: false } };

export default function SocialAccountsPage({ searchParams }: PageProps<"/dashboard/marketing/accounts">) {
  return (
    <>
      <PageHeader title="Social pages" description="Every NRC social media page, its link and who can get into it." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <SocialAccounts searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

async function SocialAccounts({ searchParams }: Pick<PageProps<"/dashboard/marketing/accounts">, "searchParams">) {
  const user = await requirePermission("MARKETING", "view");
  const canEdit = await can(user, "MARKETING", "edit");
  const isAdmin = user.role === "ADMIN";
  const { edit } = await searchParams;

  // The encrypted password never leaves the server; pages only learn whether one is saved.
  const rows = (await db.socialAccount.findMany({ orderBy: [{ platform: "asc" }, { name: "asc" }] })).map(({ passwordEncrypted, ...row }) => ({
    ...row,
    hasPassword: Boolean(passwordEncrypted),
  }));
  const editing = canEdit ? rows.find((row) => row.id === edit) ?? null : null;

  return (
    <div className={cn("grid items-start gap-8", canEdit && "lg:grid-cols-[1.3fr_1fr]")}>
      <ul className="grid gap-4">
        {rows.length === 0 && <Card tone="solid">No pages added yet.</Card>}
        {rows.map((row) => (
          <li key={row.id}>
            <Card tone="solid" className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">{platformLabels[row.platform]}</Badge>
                <h2 className="font-display font-bold">{row.name}</h2>
                {row.handle && <span className="text-sm text-muted">{row.handle}</span>}
                {row.followers !== null && <Badge tone="neutral">{row.followers.toLocaleString("en-GB")} followers</Badge>}
              </div>
              <dl className="mt-3 grid gap-1.5 text-sm">
                {row.url && (
                  <Detail label="Page">
                    <a href={row.url} target="_blank" rel="noreferrer" className="font-medium text-brand-700 hover:underline">{row.url}</a>
                  </Detail>
                )}
                {row.loginEmail && <Detail label="Login">{row.loginEmail}</Detail>}
                {row.hasPassword && <Detail label="Password">{isAdmin ? <RevealPassword id={row.id} /> : "Saved (admins only)"}</Detail>}
                {row.twoFactorNote && <Detail label="Two-step code">{row.twoFactorNote}</Detail>}
                {row.managedBy && <Detail label="Who has access">{row.managedBy}</Detail>}
                {row.notes && <Detail label="Notes"><span className="whitespace-pre-line">{row.notes}</span></Detail>}
              </dl>
              {canEdit && (
                <div className="mt-3 flex flex-wrap items-center gap-1">
                  <Link href={`/dashboard/marketing/accounts?edit=${row.id}`} className={buttonStyles({ variant: "glass", size: "sm" })}>Edit</Link>
                  <DeleteButton action={deleteSocialAccount.bind(null, row.id)} question={`Remove ${row.name} from the list?`} />
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>

      {canEdit && (
        <Card tone="solid">
          <h2 className="mb-4 text-xl font-bold">{editing ? "Edit page" : "Add a page"}</h2>
          <SocialAccountForm key={editing?.id ?? "new"} account={editing} isAdmin={isAdmin} />
        </Card>
      )}
    </div>
  );
}
