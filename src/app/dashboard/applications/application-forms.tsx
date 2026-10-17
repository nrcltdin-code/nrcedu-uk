"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { addCondition, assignApplication, moveStage, saveApplicationDetails } from "./actions";

// `options` are the stages this application may move to (from allowedMoves), already labelled.
export function StageForm({ id, options }: { id: string; options: { value: string; label: string; closed: boolean }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(moveStage, {});

  if (options.length === 0) return <p className="text-sm text-muted">This application is closed. Only an administrator can reopen it.</p>;
  const open = options.filter((o) => !o.closed);
  const closed = options.filter((o) => o.closed);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={id} />
      <div>
        <Label htmlFor="a-stage">Next stage</Label>
        <Select id="a-stage" name="stage" defaultValue="" required>
          <option value="" disabled>Choose…</option>
          {open.length > 0 && <optgroup label="Move along">{open.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>}
          {closed.length > 0 && <optgroup label="Close the application">{closed.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>}
        </Select>
      </div>
      <div>
        <Label htmlFor="a-stage-note">Note (the student sees this)</Label>
        <Input id="a-stage-note" name="note" maxLength={1000} placeholder="Required when closing, e.g. the reason for a refusal" />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Move"}</Button>
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
      {state.error && <FormMessage state={state} />}
      <Button type="submit" size="sm" variant="glass" disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Save details"}</Button>
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
        <Button type="submit" size="sm" variant="glass" disabled={pending}>{pending ? "…" : "Add"}</Button>
      </div>
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
        <Button type="submit" variant="glass" disabled={pending}>{pending ? "…" : "Save"}</Button>
      </div>
      {state.error && <FormMessage state={state} />}
    </form>
  );
}
