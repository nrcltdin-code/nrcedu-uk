"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { KeepValuesOnError } from "@/components/ui/keep-values-on-error";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";

type Action = (previous: FormState, form: FormData) => Promise<FormState>;

// A review decision laid out so the "yes" and the "no" never sit side by side:
// approve stands alone; sending back lives in its own section, with the note it needs.
// Destructive choices (reject, revoke) are pushed to the far side of that section.
export function DecisionForm({
  action: serverAction,
  hidden,
  approve,
  sendBack = [],
  destructive,
  notePlaceholder,
  noteHeading = "Not ready?",
}: {
  action: Action;
  hidden: Record<string, string>;
  approve?: { label: string; hint?: string };
  sendBack?: { value: string; label: string }[];
  destructive?: { value: string; label: string };
  notePlaceholder: string;
  noteHeading?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(serverAction, {});
  const id = Object.values(hidden).join("-");

  return (
    <div className="grid gap-4">
      {approve && (
        <form action={action} className="grid gap-1.5">
          {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <Button name="decision" value="APPROVED" disabled={pending} className="justify-self-start">{approve.label}</Button>
          {approve.hint && <p className="text-xs text-muted">{approve.hint}</p>}
        </form>
      )}

      {(sendBack.length > 0 || destructive) && (
        <form action={action} className={`grid gap-3 ${approve ? "border-t border-brand-900/10 pt-4" : ""}`}>
          {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <div>
            <Label htmlFor={`dn-${id}`}>{approve ? noteHeading : "Note to the agent"}</Label>
            <Textarea id={`dn-${id}`} name="note" rows={3} maxLength={1000} placeholder={notePlaceholder} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sendBack.map((b) => (
              <Button key={b.value} name="decision" value={b.value} variant="glass" disabled={pending}>{b.label}</Button>
            ))}
            {destructive && (
              <Button name="decision" value={destructive.value} variant="ghost" disabled={pending} className="ml-auto text-red-700 hover:bg-red-500/10">
                {destructive.label}
              </Button>
            )}
          </div>
          <KeepValuesOnError state={state} failed={Boolean(state.error)} />
        </form>
      )}

      <FormMessage state={state} />
    </div>
  );
}

// For one uploaded file: Approve, or open "Send back" to write what is wrong.
export function FileReview({ action: serverAction, id, sendBackLabel, notePlaceholder }: { action: Action; id: string; sendBackLabel: string; notePlaceholder: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(serverAction, {});
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2 grid gap-2">
      {!open ? (
        <div className="flex flex-wrap items-center gap-3">
          <form action={action}>
            <input type="hidden" name="id" value={id} />
            <Button size="sm" name="decision" value="APPROVED" disabled={pending}>Approve</Button>
          </form>
          <span className="text-sm text-muted">or</span>
          <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-red-700 hover:underline">
            {sendBackLabel}…
          </button>
        </div>
      ) : (
        <form action={action} className="grid gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <input type="hidden" name="id" value={id} />
          <Label htmlFor={`fr-${id}`}>What is wrong?</Label>
          <Input id={`fr-${id}`} name="note" maxLength={500} required autoFocus placeholder={notePlaceholder} className="h-9" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" name="decision" value="REJECTED" disabled={pending} className="bg-red-700 hover:bg-red-800">{sendBackLabel}</Button>
            <Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
          <KeepValuesOnError state={state} failed={Boolean(state.error)} />
        </form>
      )}
      {state.error && <FormMessage state={state} />}
    </div>
  );
}
