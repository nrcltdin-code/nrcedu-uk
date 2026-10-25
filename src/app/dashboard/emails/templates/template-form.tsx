"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Input, Label, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { saveTemplate } from "./actions";

type Template = { id: string; name: string; subject: string; body: string; sortOrder: number };

export function TemplateForm({ template }: { template?: Template }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveTemplate, {});
  const key = template?.id ?? "new";

  return (
    <form action={action} className="grid gap-3" key={template ? undefined : String(state.saved)}>
      {template && <input type="hidden" name="id" value={template.id} />}
      <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
        <div>
          <Label htmlFor={`t-name-${key}`}>Template name</Label>
          <Input id={`t-name-${key}`} name="name" defaultValue={template?.name} maxLength={60} required placeholder="e.g. Documents needed" />
        </div>
        <div>
          <Label htmlFor={`t-order-${key}`}>Order</Label>
          <Input id={`t-order-${key}`} name="sortOrder" type="number" step={1} defaultValue={template?.sortOrder ?? 0} />
        </div>
      </div>
      <div>
        <Label htmlFor={`t-subject-${key}`}>Subject</Label>
        <Input id={`t-subject-${key}`} name="subject" defaultValue={template?.subject} maxLength={150} required />
      </div>
      <div>
        <Label htmlFor={`t-body-${key}`}>Message</Label>
        <Textarea id={`t-body-${key}`} name="body" defaultValue={template?.body} maxLength={10000} className="min-h-56" required />
      </div>
      <FormMessage state={state} />
      <SaveButton size="sm" disabled={pending} className="justify-self-start">{pending ? "Saving…" : template ? "Save template" : "Add template"}</SaveButton>
    </form>
  );
}
