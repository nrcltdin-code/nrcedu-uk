"use client";

import { useActionState } from "react";
import { Checkbox, FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { createDocumentRequest } from "./request-actions";

type Props = {
  studentId: string;
  types: { value: string; label: string }[];
  // Fixed to one application (application page), or a choice (student page).
  applicationId?: string;
  applications?: { id: string; name: string }[];
};

// Ask the student for one more document. It appears on their Documents page, open for upload.
export function RequestForm({ studentId, types, applicationId, applications = [] }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(createDocumentRequest, {});
  const id = applicationId ?? studentId;

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="studentId" value={studentId} />
      {applicationId && <input type="hidden" name="applicationId" value={applicationId} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`r-type-${id}`}>Kind of document</Label>
          <Select id={`r-type-${id}`} name="type" defaultValue="" required>
            <option value="" disabled>Choose…</option>
            {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor={`r-label-${id}`}>Name shown to the student</Label>
          <Input id={`r-label-${id}`} name="label" maxLength={120} placeholder="e.g. Bank statement, last 3 months" />
        </div>
        {!applicationId && applications.length > 0 && (
          <div>
            <Label htmlFor={`r-app-${id}`}>For application</Label>
            <Select id={`r-app-${id}`} name="applicationId" defaultValue="">
              <option value="">General (all applications)</option>
              {applications.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor={`r-due-${id}`}>Due by</Label>
          <Input id={`r-due-${id}`} name="dueAt" type="date" />
        </div>
      </div>
      <div>
        <Label htmlFor={`r-help-${id}`}>Instructions</Label>
        <Textarea id={`r-help-${id}`} name="instructions" maxLength={1000} rows={2} placeholder="Optional, e.g. All pages, stamped by the bank" />
      </div>
      <Checkbox name="required" defaultChecked>Required before the application is submitted</Checkbox>
      <FormMessage state={state} />
      <SaveButton size="sm" disabled={pending} className="justify-self-start">{pending ? "Asking…" : "Ask the student"}</SaveButton>
    </form>
  );
}
