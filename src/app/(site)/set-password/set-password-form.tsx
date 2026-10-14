"use client";

import { useActionState } from "react";
import { FormError } from "@/components/site/form-parts";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { setPasswordFromInvite } from "./actions";
import type { SetPasswordState } from "./actions";

export function SetPasswordForm({ invite, email }: { invite: string; email: string }) {
  const [state, action, pending] = useActionState<SetPasswordState, FormData>(setPasswordFromInvite, {});

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="invite" value={invite} />
      {/* Helps password managers save the right username. */}
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
      <div>
        <Label htmlFor="sp-password">New password</Label>
        <Input id="sp-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
      </div>
      <div>
        <Label htmlFor="sp-confirm">Type it again</Label>
        <Input id="sp-confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
      </div>
      {state.error && <FormError>{state.error}</FormError>}
      <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Set password"}</Button>
    </form>
  );
}
