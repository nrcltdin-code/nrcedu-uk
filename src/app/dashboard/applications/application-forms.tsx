"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { KeepValuesOnError } from "@/components/ui/keep-values-on-error";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Input, Label, Select } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { addCondition, assignApplication, moveStage, saveApplicationDetails } from "./actions";

type StageOption = { value: string; label: string; closed: boolean; needsNote: boolean };

// A track of the application's stages: done ones ticked, the current one marked, and the ones it
// may move to (from allowedMoves) as tick boxes. End states sit apart under "Close the application".
export function StageForm({ id, current, track, options }: { id: string; current: string; track: { value: string; label: string }[]; options: StageOption[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(moveStage, {});
  const [picked, setPicked] = useState("");

  if (options.length === 0) return <p className="text-sm text-muted">This application is closed. Only an administrator can reopen it.</p>;
  const allowed = new Map(options.map((o) => [o.value, o]));
  const at = track.findIndex((t) => t.value === current);
  const closing = options.filter((o) => o.closed && o.value !== "ENROLLED");
  const choice = allowed.get(picked);

  const box = (value: string, label: string, tone: "brand" | "danger") => (
    <label className={`flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-brand-600/8 ${picked === value ? (tone === "danger" ? "bg-red-500/10" : "bg-brand-600/10") : ""}`}>
      <input type="radio" name="stage" value={value} checked={picked === value} onChange={() => setPicked(value)} required className="peer sr-only" />
      <span aria-hidden className={`grid size-5 shrink-0 place-items-center rounded-md border-2 text-xs font-bold text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600/40 ${picked === value ? (tone === "danger" ? "border-red-600 bg-red-600" : "border-brand-600 bg-brand-600") : "border-brand-900/25 bg-white"}`}>
        {picked === value && "✓"}
      </span>
      <span className="text-sm">{label}</span>
    </label>
  );

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={id} />
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Tick the stage it has reached</legend>
        <ol className="grid">
          {track.map((t, i) => {
            const option = allowed.get(t.value);
            if (t.value === current) {
              return (
                <li key={t.value} className="flex items-center gap-3 px-2 py-1.5">
                  <span aria-hidden className="size-5 shrink-0 rounded-full border-[5px] border-brand-600 bg-white" />
                  <span className="text-sm font-semibold">{t.label} <span className="font-normal text-muted">(now)</span></span>
                </li>
              );
            }
            if (option) return <li key={t.value}>{box(t.value, i < at ? `${t.label} (step back)` : t.label, "brand")}</li>;
            const done = at >= 0 && i < at;
            return (
              <li key={t.value} className="flex items-center gap-3 px-2 py-1.5 text-muted">
                <span aria-hidden className={`grid size-5 shrink-0 place-items-center rounded-full text-xs ${done ? "bg-emerald-600 text-white" : "border-2 border-brand-900/15"}`}>{done && "✓"}</span>
                <span className="text-sm">{t.label}{done && <span className="sr-only"> (done)</span>}</span>
              </li>
            );
          })}
        </ol>
      </fieldset>
      {closing.length > 0 && (
        <fieldset className="border-t border-brand-900/10 pt-3">
          <legend className="mb-1 pt-3 text-sm font-semibold">Or close the application</legend>
          <div className="grid">{closing.map((o) => <div key={o.value}>{box(o.value, o.label, "danger")}</div>)}</div>
        </fieldset>
      )}
      <div>
        <Label htmlFor="a-stage-note">Note (the student sees this){choice?.needsNote && <span className="text-red-700"> · required</span>}</Label>
        <Input id="a-stage-note" name="note" maxLength={1000} required={choice?.needsNote} placeholder={choice?.needsNote ? "Say why, e.g. the reason for a refusal" : "Optional"} />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending || !picked} className="justify-self-start">{pending ? "Saving…" : choice ? `Move to ${choice.label}` : "Move"}</Button>
    </form>
  );
}

type Details = { id: string; universityRef: string | null; casNumber: string | null; visaReference: string | null; depositAmount: string | null; currency: string; confirmationName: string };

export function DetailsForm({ details }: { details: Details }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveApplicationDetails, {});

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="id" value={details.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="k-ref">University applicant ID</Label>
          <Input id="k-ref" name="universityRef" maxLength={80} defaultValue={details.universityRef ?? ""} />
        </div>
        <div>
          <Label htmlFor="k-deposit">Deposit paid ({details.currency})</Label>
          <Input id="k-deposit" name="depositAmount" inputMode="decimal" defaultValue={details.depositAmount ?? ""} />
        </div>
        <div>
          <Label htmlFor="k-cas">{details.confirmationName} number</Label>
          <Input id="k-cas" name="casNumber" maxLength={80} defaultValue={details.casNumber ?? ""} />
        </div>
        <div>
          <Label htmlFor="k-visa">Visa application reference</Label>
          <Input id="k-visa" name="visaReference" maxLength={80} defaultValue={details.visaReference ?? ""} />
        </div>
      </div>
      <KeepValuesOnError state={state} failed={Boolean(state.error)} />
      {state.error && <FormMessage state={state} />}
      <SaveButton size="sm" variant="glass" disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Save details"}</SaveButton>
    </form>
  );
}

export function ConditionForm({ applicationId }: { applicationId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addCondition, {});

  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <Label htmlFor="c-text" className="sr-only">New condition</Label>
      <div className="flex gap-2">
        <Input id="c-text" name="text" maxLength={300} placeholder="e.g. IELTS 6.5 overall, no band below 6.0" required />
        <SaveButton size="sm" variant="glass" disabled={pending}>{pending ? "…" : "Add"}</SaveButton>
      </div>
      <KeepValuesOnError state={state} failed={Boolean(state.error)} />
      {state.error && <FormMessage state={state} />}
    </form>
  );
}

export function AssignForm({ id, assignedStaffId, staff }: { id: string; assignedStaffId: string | null; staff: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(assignApplication, {});

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="id" value={id} />
      <Label htmlFor="a-staff">Handled by</Label>
      <div className="flex gap-2">
        <Select id="a-staff" name="assignedStaffId" defaultValue={assignedStaffId ?? ""}>
          <option value="">Not assigned</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <SaveButton variant="glass" disabled={pending}>{pending ? "…" : "Save"}</SaveButton>
      </div>
      <KeepValuesOnError state={state} failed={Boolean(state.error)} />
      {state.error && <FormMessage state={state} />}
    </form>
  );
}
