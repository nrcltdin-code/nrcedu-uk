"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";

type NoteFormProps = {
  action: (previous: FormState, form: FormData) => Promise<FormState>;
  // Hidden field naming the record the note belongs to, e.g. { leadId: "…" }.
  field: Record<string, string>;
  placeholder?: string;
};

// Internal note box for leads, students and applications. Give it a `key` that changes
// when a note is added so it clears.
export function NoteForm({ action, field, placeholder = "Called, no answer. Try again Thursday…" }: NoteFormProps) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const [[name, value]] = Object.entries(field);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name={name} value={value} />
      <Label htmlFor={`note-${value}`} className="sr-only">New note</Label>
      <Textarea id={`note-${value}`} name="body" maxLength={5000} placeholder={placeholder} required />
      {state.error && <FormMessage state={state} />}
      <Button type="submit" size="sm" disabled={pending} className="justify-self-start">{pending ? "Adding…" : "Add note"}</Button>
    </form>
  );
}
