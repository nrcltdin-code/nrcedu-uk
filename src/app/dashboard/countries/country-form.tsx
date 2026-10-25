"use client";

import { useActionState } from "react";
import { Checkbox, FormMessage } from "@/components/dashboard/form-bits";
import { ImageField } from "@/components/dashboard/image-field";
import { MarkdownEditor } from "@/components/dashboard/markdown-editor";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Label, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { saveCountry } from "./actions";

type CountryValues = {
  id: string;
  description: string | null;
  tagline: string | null;
  content: string | null;
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
        <Label htmlFor="country-tagline">Banner text (one or two lines)</Label>
        <Textarea id="country-tagline" name="tagline" defaultValue={country.tagline ?? ""} maxLength={300} className="min-h-20" />
      </div>
      <div>
        <Label htmlFor="country-description">Short description (cards and search results)</Label>
        <Textarea id="country-description" name="description" defaultValue={country.description ?? ""} maxLength={5000} className="min-h-24" />
      </div>
      <div>
        <Label htmlFor="country-content">Details (shown below the banner)</Label>
        <MarkdownEditor id="country-content" name="content" defaultValue={country.content ?? ""} maxLength={100_000} />
      </div>
      <ImageField name="imageUrl" label="Image" defaultValue={country.imageUrl} />
      <ImageField name="flagUrl" label="Flag" defaultValue={country.flagUrl} fit="contain" />
      <FormMessage state={state} />
      <SaveButton disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Save country"}</SaveButton>
    </form>
  );
}
