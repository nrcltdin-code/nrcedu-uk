"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { KeepValuesOnError } from "@/components/ui/keep-values-on-error";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Input, Label, Select } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { addReminder } from "./actions";

type ReminderFormProps = {
  // Hidden field naming the record, e.g. { leadId: "…" }; none for a personal reminder.
  field?: Record<string, string>;
  staff: { id: string; name: string }[];
  me: string;
  tomorrow: string;
};

// Give it a `key` that changes when a reminder is added so it clears.
export function ReminderForm({ field, staff, me, tomorrow }: ReminderFormProps) {
  const [state, action, pending] = useActionState<FormState, FormData>(addReminder, {});
  const [name, value] = field ? Object.entries(field)[0] : [];

  return (
    <form action={action} className="grid gap-3">
      {name && <input type="hidden" name={name} value={value} />}
      <div>
        <Label htmlFor="reminder-text">Follow up</Label>
        <Input id="reminder-text" name="text" maxLength={300} placeholder="Call back about the offer letter" required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="reminder-due">On</Label>
          <Input id="reminder-due" name="dueAt" type="date" defaultValue={tomorrow} required />
        </div>
        <div>
          <Label htmlFor="reminder-staff">For</Label>
          <Select id="reminder-staff" name="staffId" defaultValue={me}>
            {staff.map((person) => (
              <option key={person.id} value={person.id}>{person.id === me ? `${person.name} (me)` : person.name}</option>
            ))}
          </Select>
        </div>
      </div>
      <KeepValuesOnError state={state} failed={Boolean(state.error)} />
      {state.error && <FormMessage state={state} />}
      <SaveButton size="sm" disabled={pending} className="justify-self-start">{pending ? "Adding…" : "Add reminder"}</SaveButton>
    </form>
  );
}
