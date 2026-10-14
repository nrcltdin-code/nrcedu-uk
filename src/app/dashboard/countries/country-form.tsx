"use client";

import { useActionState } from "react";
import { Checkbox, FormMessage } from "@/components/dashboard/form-bits";
import { ImageField } from "@/components/dashboard/image-field";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { saveCountry } from "./actions";

type CountryValues = {
  id: string;
  description: string | null;
  imageUrl: string | null;
  flagUrl: string | null;
  isDestination: boolean;
};

export function CountryForm({ country }: { country: CountryValues }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCountry, {});

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={country.id} />
      <Checkbox name="isDestination" defaultChecked={country.isDestination}>
        Study destination (gets its own page under /destinations)
      </Checkbox>
      <div>
        <Label htmlFor="country-description">Description</Label>
        <Textarea id="country-description" name="description" defaultValue={country.description ?? ""} maxLength={5000} className="min-h-40" />
      </div>
      <ImageField name="imageUrl" label="Image" defaultValue={country.imageUrl} />
      <ImageField name="flagUrl" label="Flag" defaultValue={country.flagUrl} fit="contain" />
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Save country"}</Button>
    </form>
  );
}
