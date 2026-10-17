"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { FormError, FormSuccess, SpamTrap } from "@/components/site/form-parts";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { applyAsAgent } from "./actions";
import type { AgentFormState } from "./actions";

export function AgentForm({ countries }: { countries: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<AgentFormState, FormData>(applyAsAgent, { status: "idle" });
  const [kind, setKind] = useState<"INDIVIDUAL" | "AGENCY">("INDIVIDUAL");

  if (state.status === "sent") {
    return (
      <FormSuccess title="Account created">
        Next, <Link href="/?auth=login&next=/dashboard" className="font-semibold underline">sign in</Link> and upload your verification documents. We review them and email you once your account is approved.
      </FormSuccess>
    );
  }

  return (
    <form action={action} className="grid gap-4">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">I am registering as</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ["INDIVIDUAL", "An individual agent", "You work on your own."],
            ["AGENCY", "An agency", "A company with staff. You can add your team after approval."],
          ] as const).map(([value, title, help]) => (
            <label key={value} className={`cursor-pointer rounded-2xl border p-4 ${kind === value ? "border-brand-600 bg-brand-600/8" : "border-brand-900/15"}`}>
              <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} className="sr-only" />
              <span className="block font-semibold">{title}</span>
              <span className="block text-sm text-muted">{help}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="agent-name">Full name</Label>
          <Input id="agent-name" name="name" autoComplete="name" maxLength={100} required />
        </div>
        <div>
          <Label htmlFor="agent-company">{kind === "AGENCY" ? "Agency name" : "Trading name (optional)"}</Label>
          <Input id="agent-company" name="companyName" autoComplete="organization" maxLength={150} required={kind === "AGENCY"} />
        </div>
        {kind === "AGENCY" && (
          <div>
            <Label htmlFor="agent-reg">Business registration number</Label>
            <Input id="agent-reg" name="registrationNumber" maxLength={60} />
          </div>
        )}
        <div>
          <Label htmlFor="agent-web">Website (optional)</Label>
          <Input id="agent-web" name="website_url" type="url" placeholder="https://" maxLength={200} />
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
          <p className="mt-1.5 text-xs text-muted">At least 8 characters. Sign in with it to upload your documents.</p>
        </div>
        <div>
          <Label htmlFor="agent-confirm">Repeat the password</Label>
          <Input id="agent-confirm" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
        </div>
      </div>
      <SpamTrap />

      {state.status === "error" && <FormError>{state.error}</FormError>}

      <Button type="submit" variant="accent" size="lg" disabled={pending}>
        {pending ? "Creating…" : "Create agent account"}
      </Button>
    </form>
  );
}
