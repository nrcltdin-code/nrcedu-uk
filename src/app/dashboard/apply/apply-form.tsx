"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { applyForCourse } from "./actions";

export function ApplyForm({ courseId, intakes }: { courseId: string; intakes: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(applyForCourse, {});

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="courseId" value={courseId} />
      <div>
        <Label htmlFor="apply-intake">When do you want to start?</Label>
        <Select id="apply-intake" name="intakeId" defaultValue={intakes[0]?.id ?? ""}>
          {intakes.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
          <option value="">Not sure yet, my counsellor will advise</option>
        </Select>
      </div>
      <FormMessage state={state} />
      <Button type="submit" variant="accent" disabled={pending} className="justify-self-start">{pending ? "Sending…" : "Start my application"}</Button>
    </form>
  );
}
