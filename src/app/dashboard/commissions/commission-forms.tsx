"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { KeepValuesOnError } from "@/components/ui/keep-values-on-error";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { addCommission, addExpectedCommissions, updateCommission } from "./actions";
import { commissionStatusLabels, directionLabels } from "./labels";

type Direction = keyof typeof directionLabels;

export function ExpectedCommissionsButton({ applicationId }: { applicationId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(() => addExpectedCommissions(applicationId), {});
  return (
    <form action={action} className="grid gap-2">
      <Button size="sm" disabled={pending} className="justify-self-start">{pending ? "Working out…" : "Add expected amounts from the rates"}</Button>
      <KeepValuesOnError state={state} failed={Boolean(state.error)} />
      {state.error && <FormMessage state={state} />}
    </form>
  );
}

export function AddCommissionForm({ applicationId, hasAgent, currency }: { applicationId: string; hasAgent: boolean; currency: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addCommission, {});
  return (
    <details open={Boolean(state.error)}>
      <summary className="cursor-pointer text-sm font-semibold text-brand-700">Enter an amount by hand</summary>
      <form action={action} className="mt-3 grid gap-3 sm:grid-cols-[1fr_8rem_5rem]">
        <input type="hidden" name="applicationId" value={applicationId} />
        <Select name="direction" aria-label="Who pays" defaultValue="UNIVERSITY_TO_NRC">
          <option value="UNIVERSITY_TO_NRC">{directionLabels.UNIVERSITY_TO_NRC}</option>
          {hasAgent && <option value="NRC_TO_AGENT">{directionLabels.NRC_TO_AGENT}</option>}
        </Select>
        <Input name="amount" type="number" min={0.01} step="0.01" placeholder="Amount" aria-label="Amount" required />
        <Input name="currency" defaultValue={currency} maxLength={3} aria-label="Currency" required />
        <Input name="note" maxLength={300} placeholder="Note (optional)" aria-label="Note" className="sm:col-span-3" />
        <div className="grid gap-2 sm:col-span-3">
          <FormMessage state={state} />
          <Button size="sm" variant="glass" disabled={pending} className="justify-self-start">{pending ? "Adding…" : "Add"}</Button>
        </div>
      </form>
    </details>
  );
}

type Row = { id: string; direction: Direction; amount: string; currency: string; status: "PENDING" | "SETTLED" | "CANCELLED"; note: string | null };

export function CommissionRowForm({ row }: { row: Row }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateCommission, {});
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-[8rem_9rem_1fr_auto] sm:items-end">
      <input type="hidden" name="id" value={row.id} />
      <div>
        <Label htmlFor={`c-amount-${row.id}`} className="text-xs">Amount ({row.currency})</Label>
        <Input id={`c-amount-${row.id}`} name="amount" type="number" min={0.01} step="0.01" defaultValue={row.amount} required />
      </div>
      <div>
        <Label htmlFor={`c-status-${row.id}`} className="text-xs">Status</Label>
        <Select id={`c-status-${row.id}`} name="status" defaultValue={row.status}>
          {(["PENDING", "SETTLED", "CANCELLED"] as const).map((s) => (
            <option key={s} value={s}>{commissionStatusLabels[row.direction][s]}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor={`c-note-${row.id}`} className="text-xs">Note</Label>
        <Input id={`c-note-${row.id}`} name="note" defaultValue={row.note ?? ""} maxLength={300} placeholder="e.g. invoice number" />
      </div>
      <Button size="sm" variant="glass" disabled={pending}>{pending ? "…" : state.saved ? "Saved ✓" : "Save"}</Button>
      <KeepValuesOnError state={state} failed={Boolean(state.error)} />
      {state.error && <div className="sm:col-span-4"><FormMessage state={state} /></div>}
    </form>
  );
}
