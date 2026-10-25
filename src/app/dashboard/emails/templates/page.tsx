import type { Metadata } from "next";
import { Suspense } from "react";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";
import { deleteTemplate } from "./actions";
import { TemplateForm } from "./template-form";

export const metadata: Metadata = { title: "Email templates", robots: { index: false } };

export default function TemplatesPage() {
  return (
    <>
      <PageHeader
        back={{ href: "/dashboard/emails", label: "Email" }}
        title="Email templates"
        description="Ready-made emails staff can start from when they press Send email on a lead, student or agent."
      />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <Templates />
      </Suspense>
    </>
  );
}

async function Templates() {
  await requirePermission("SETTINGS", "edit");
  const templates = await db.emailTemplate.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

  return (
    <div className="grid max-w-3xl gap-6">
      <Card tone="solid" className="text-sm">
        <p className="font-semibold">Fill-in words</p>
        <p className="mt-1 text-muted">These are replaced when someone picks the template:</p>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          <li><code>{"{first_name}"}</code> the person&apos;s first name</li>
          <li><code>{"{name}"}</code> their full name</li>
          <li><code>{"{my_name}"}</code> the staff member writing</li>
          <li><code>{"{portal_link}"}</code> link to sign in to the portal</li>
        </ul>
      </Card>

      {templates.map((template) => (
        <Card key={template.id} tone="solid">
          <details>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span>
                <span className="block font-semibold">{template.name}</span>
                <span className="block text-sm text-muted">{template.subject}</span>
              </span>
              <span className="text-sm text-brand-700">Edit</span>
            </summary>
            <div className="mt-4 grid gap-4">
              <TemplateForm template={template} />
              <DeleteButton action={deleteTemplate.bind(null, template.id)} question={`Delete the "${template.name}" template?`} />
            </div>
          </details>
        </Card>
      ))}
      {templates.length === 0 && <Card tone="solid" className="text-muted">No templates yet.</Card>}

      <Card tone="solid">
        <h2 className="mb-4 text-lg font-bold">New template</h2>
        <TemplateForm />
      </Card>
    </div>
  );
}
