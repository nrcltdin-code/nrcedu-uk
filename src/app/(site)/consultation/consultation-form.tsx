"use client";

import { useActionState } from "react";
import { FormError, FormSuccess, SpamTrap } from "@/components/site/form-parts";
import { KeepValuesOnError } from "@/components/ui/keep-values-on-error";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { requestConsultation } from "./actions";
import type { ConsultationState } from "./actions";

type Option = { id: string; name: string };

export function ConsultationForm({
  countries,
  destinations,
  levels,
}: {
  countries: Option[];
  destinations: Option[];
  levels: { value: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<ConsultationState, FormData>(requestConsultation, { status: "idle" });

  if (state.status === "sent") {
    return (
      <FormSuccess title="Request received">
        Thank you. A counsellor will contact you shortly to arrange your free consultation.
      </FormSuccess>
    );
  }

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="consult-name">Full name</Label>
          <Input id="consult-name" name="name" autoComplete="name" maxLength={100} required />
        </div>
        <div>
          <Label htmlFor="consult-email">Email</Label>
          <Input id="consult-email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="consult-phone">Phone or WhatsApp</Label>
          <Input id="consult-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} required />
        </div>
        <div>
          <Label htmlFor="consult-country">Country you live in</Label>
          <Select id="consult-country" name="countryId" defaultValue="" autoComplete="country-name" required>
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
          <Label htmlFor="consult-destination">Where do you want to study?</Label>
          <Select id="consult-destination" name="destinationCountryId" defaultValue="">
            <option value="">Not sure yet</option>
            {destinations.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="consult-level">Level of study</Label>
          <Select id="consult-level" name="studyLevel" defaultValue="">
            <option value="">Not sure yet</option>
            {levels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="consult-message">Anything we should know? (optional)</Label>
        <Textarea id="consult-message" name="message" maxLength={2000} placeholder="Your grades, the subject you are interested in, your budget…" />
      </div>
      <SpamTrap />

      <KeepValuesOnError state={state} failed={state.status === "error"} />
      {state.status === "error" && <FormError>{state.error}</FormError>}

      <Button type="submit" variant="accent" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Request my free consultation"}
      </Button>
    </form>
  );
}
