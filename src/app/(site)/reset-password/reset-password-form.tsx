"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormError } from "@/components/site/form-parts";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("password"));
    if (newPassword !== String(form.get("confirm"))) {
      setError("The two passwords do not match.");
      return;
    }
    setError(null);
    setPending(true);
    const { error } = await authClient.resetPassword({ newPassword, token });
    setPending(false);
    if (error) {
      setError(
        error.code === "INVALID_TOKEN"
          ? "This link has expired or was already used. Ask for a new one from “Forgot password?”."
          : (error.message ?? "Something went wrong. Please try again."),
      );
      return;
    }
    router.push("/?auth=login&next=/dashboard&notice=password-set");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div>
        <Label htmlFor="rp-password">New password</Label>
        <Input id="rp-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
      </div>
      <div>
        <Label htmlFor="rp-confirm">Type it again</Label>
        <Input id="rp-confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
      </div>
      {error && <FormError>{error}</FormError>}
      <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Save new password"}</Button>
    </form>
  );
}
