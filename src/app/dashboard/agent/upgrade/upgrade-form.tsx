"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { KeepValuesOnError } from "@/components/ui/keep-values-on-error";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { requestAgencyUpgrade } from "./actions";

export function UpgradeRequestForm({ companyName, registrationNumber, again }: { companyName: string; registrationNumber: string; again: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(requestAgencyUpgrade, {});
  if (state.saved) return <p role="status" className="text-sm text-emerald-800">Sent. We will email you when we have reviewed it. You can keep working as usual meanwhile.</p>;
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="u-company">Agency name</Label>
          <Input id="u-company" name="companyName" defaultValue={companyName} maxLength={150} required />
        </div>
        <div>
          <Label htmlFor="u-reg">Business registration number</Label>
          <Input id="u-reg" name="registrationNumber" defaultValue={registrationNumber} maxLength={60} />
        </div>
      </div>
      <KeepValuesOnError state={state} failed={Boolean(state.error)} />
      {state.error && <FormMessage state={state} />}
      <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Sending…" : again ? "Send request again" : "Send request"}</Button>
    </form>
  );
}
