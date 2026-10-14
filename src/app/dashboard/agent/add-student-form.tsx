"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { addMyStudent } from "./actions";

export function AddStudentForm({ countries }: { countries: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addMyStudent, {});

  return (
    <form action={action} className="grid gap-4">
      <div>
        <Label htmlFor="as-name">Full name (as on passport)</Label>
        <Input id="as-name" name="name" maxLength={100} required />
      </div>
      <div>
        <Label htmlFor="as-email">Student&apos;s own email</Label>
        <Input id="as-email" name="email" type="email" maxLength={254} required />
      </div>
      <div>
        <Label htmlFor="as-phone">Phone</Label>
        <Input id="as-phone" name="phone" type="tel" maxLength={30} />
      </div>
      <div>
        <Label htmlFor="as-country">Lives in</Label>
        <Select id="as-country" name="countryId" defaultValue="">
          <option value="">Choose…</option>
          {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Adding…" : "Add student"}</Button>
    </form>
  );
}
