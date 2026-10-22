"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import type { FormState } from "@/lib/form";
import { recordSubmission, sendSubmissionEmail } from "./actions";

async function copy(value: string, what: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast(`Copied ${what}`);
  } catch {
    toast("Could not copy. Select the text and copy it instead.", "error");
  }
}

// One value from the student's file with a copy button, for pasting into a portal form.
export function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-900/10 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
        <p className="break-words">{value}</p>
      </div>
      <Button type="button" variant="ghost" size="sm" className="shrink-0 print:hidden" onClick={() => copy(value, label.toLowerCase())} aria-label={`Copy ${label}`}>
        Copy
      </Button>
    </div>
  );
}

export function CopyAllButton({ value }: { value: string }) {
  return (
    <Button type="button" variant="glass" size="sm" onClick={() => copy(value, "all details")}>
      Copy all as text
    </Button>
  );
}

export function PrintButton() {
  return (
    <Button type="button" variant="glass" size="sm" onClick={() => window.print()}>
      Print or save as PDF
    </Button>
  );
}

type Doc = { id: string; label: string; fileName: string };

export function EmailForm({ id, to, subject, message, documents, disabled }: { id: string; to: string; subject: string; message: string; documents: Doc[]; disabled: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendSubmissionEmail, {});

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="e-to">To</Label>
          <Input id="e-to" name="to" type="email" required defaultValue={to} placeholder="admissions@university.ac.uk" />
        </div>
        <div>
          <Label htmlFor="e-subject">Subject</Label>
          <Input id="e-subject" name="subject" required maxLength={150} defaultValue={subject} />
        </div>
      </div>
      <div>
        <Label htmlFor="e-message">Message</Label>
        <Textarea id="e-message" name="message" rows={14} defaultValue={message} className="font-mono text-xs" />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Attach</legend>
        {documents.length === 0 && <p className="text-sm text-muted">No approved documents yet.</p>}
        <div className="grid gap-1.5">
          {documents.map((d) => (
            <label key={d.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="doc" value={d.id} defaultChecked className="size-4 accent-brand-600" />
              {d.fileName}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-xs text-muted">Sent from the site&apos;s address with you in copy. Replies come to your email. The application moves to Submitted once it is sent.</p>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending || disabled} className="justify-self-start">{pending ? "Sending…" : "Send to university"}</Button>
    </form>
  );
}

export function RecordForm({ id, methods, method, reference, disabled }: { id: string; methods: { value: string; label: string }[]; method: string; reference: string; disabled: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(recordSubmission, {});
  const [chosen, setChosen] = useState(method);

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="r-method">Submitted via</Label>
          <Select id="r-method" name="method" required value={chosen} onChange={(e) => setChosen(e.target.value)}>
            <option value="" disabled>Choose…</option>
            {methods.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="r-ref">University applicant ID</Label>
          <Input id="r-ref" name="universityRef" maxLength={80} defaultValue={reference} placeholder="If the portal gave one" />
        </div>
      </div>
      <div>
        <Label htmlFor="r-note">Note (the student sees this)</Label>
        <Input id="r-note" name="note" maxLength={900} placeholder="Optional" />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending || disabled} className="justify-self-start">{pending ? "Saving…" : "Mark as submitted"}</Button>
    </form>
  );
}
