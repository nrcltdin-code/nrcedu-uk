"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { KeepValuesOnError } from "@/components/ui/keep-values-on-error";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Label, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";

type MessageFormProps = {
  action: (previous: FormState, form: FormData) => Promise<FormState>;
  studentId?: string;
  placeholder: string;
};

// Give it a `key` that changes when a message is added so the box clears.
export function MessageForm({ action, studentId, placeholder }: MessageFormProps) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="grid gap-3">
      {studentId && <input type="hidden" name="studentId" value={studentId} />}
      <Label htmlFor="message-body" className="sr-only">Your message</Label>
      <Textarea id="message-body" name="body" maxLength={2000} rows={4} placeholder={placeholder} required />
      <KeepValuesOnError state={state} failed={Boolean(state.error)} />
      {state.error && <FormMessage state={state} />}
      <SaveButton size="sm" disabled={pending} className="justify-self-start">{pending ? "Sending…" : "Send message"}</SaveButton>
    </form>
  );
}
