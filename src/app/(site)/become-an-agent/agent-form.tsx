"use client";

import { useActionState } from "react";
import { FormError, FormSuccess, SpamTrap } from "@/components/site/form-parts";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { applyAsAgent } from "./actions";
import type { AgentFormState } from "./actions";

export function AgentForm({ countries }: { countries: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<AgentFormState, FormData>(applyAsAgent, { status: "idle" });

  if (state.status === "sent") {
    return (
      <FormSuccess title="Application received">
        Thank you. We will review your application and contact you. You can sign in once your account is approved.
      </FormSuccess>
    );
  }

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="agent-name">Full name</Label>
          <Input id="agent-name" name="name" autoComplete="name" maxLength={100} required />
        </div>
        <div>
          <Label htmlFor="agent-company">Company name (optional)</Label>
          <Input id="agent-company" name="companyName" autoComplete="organization" maxLength={150} />
        </div>
        <div>
          <Label htmlFor="agent-email">Email</Label>
          <Input id="agent-email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="agent-phone">Phone or WhatsApp</Label>
          <Input id="agent-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} required />
        </div>
        <div>
          <Label htmlFor="agent-country">Country you work in</Label>
          <Select id="agent-country" name="countryId" defaultValue="" required>
            <option value="" disabled>
              Choose a country
            </option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="agent-address">Office address (optional)</Label>
          <Input id="agent-address" name="address" autoComplete="street-address" maxLength={300} />
        </div>
      </div>
      <div>
        <Label htmlFor="agent-about">About your experience</Label>
        <Textarea
          id="agent-about"
          name="about"
          minLength={20}
          maxLength={2000}
          required
          placeholder="How long you have been recruiting students, the countries you send students to, and roughly how many each year."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="agent-password">Choose a password</Label>
          <Input id="agent-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
          <p className="mt-1.5 text-xs text-muted">At least 8 characters. You will use it to sign in after approval.</p>
        </div>
        <div>
          <Label htmlFor="agent-confirm">Repeat the password</Label>
          <Input id="agent-confirm" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
        </div>
      </div>
      <SpamTrap />

      {state.status === "error" && <FormError>{state.error}</FormError>}

      <Button type="submit" variant="accent" size="lg" disabled={pending}>
        {pending ? "Submitting…" : "Submit application"}
      </Button>
    </form>
  );
}
