"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { assignApplication, moveStage } from "./actions";
import { stageLabels, stages } from "./labels";

export function StageForm({ id, stage }: { id: string; stage: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(moveStage, {});

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={id} />
      <div>
        <Label htmlFor="a-stage">Stage</Label>
        <Select id="a-stage" name="stage" defaultValue={stage}>
          {stages.map((s) => <option key={s} value={s}>{stageLabels[s]}</option>)}
        </Select>
      </div>
      <div>
        <Label htmlFor="a-stage-note">Note for the history (the student sees this)</Label>
        <Input id="a-stage-note" name="note" maxLength={1000} placeholder="Optional, e.g. Offer is conditional on IELTS 6.5" />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Update stage"}</Button>
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
