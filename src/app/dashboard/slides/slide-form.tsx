"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ImageField } from "@/components/dashboard/image-field";
import { KeepValuesOnError } from "@/components/ui/keep-values-on-error";
import { Button, buttonStyles } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { saveSlide } from "./actions";
import type { SlideFormState } from "./actions";

export type SlideValues = {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  buttonLabel: string | null;
  buttonHref: string | null;
  sortOrder: number;
  isPublished: boolean;
};

export function SlideForm({ slide, nextPosition }: { slide: SlideValues | null; nextPosition: number }) {
  const [state, action, pending] = useActionState<SlideFormState, FormData>(saveSlide, {});

  return (
    <form action={action} className="grid gap-4">
      {slide && <input type="hidden" name="id" value={slide.id} />}
      <div>
        <Label htmlFor="slide-eyebrow">Small line above the title</Label>
        <Input id="slide-eyebrow" name="eyebrow" defaultValue={slide?.eyebrow ?? ""} maxLength={80} placeholder="Trusted study abroad and visa experts" />
      </div>
      <div>
        <Label htmlFor="slide-title">Title</Label>
        <Input id="slide-title" name="title" defaultValue={slide?.title} maxLength={120} required />
      </div>
      <div>
        <Label htmlFor="slide-subtitle">Text under the title</Label>
        <Textarea id="slide-subtitle" name="subtitle" defaultValue={slide?.subtitle ?? ""} maxLength={300} />
      </div>
      <ImageField name="imageUrl" label="Photo" defaultValue={slide?.imageUrl} hint="Shown in a framed card beside the text. Upright photos of a person work best (at least 900 × 1050 px). Leave empty for text only." />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="slide-button-label">Button text</Label>
          <Input id="slide-button-label" name="buttonLabel" defaultValue={slide?.buttonLabel ?? ""} maxLength={40} />
        </div>
        <div>
          <Label htmlFor="slide-button-href">Button link</Label>
          <Input id="slide-button-href" name="buttonHref" defaultValue={slide?.buttonHref ?? ""} placeholder="/consultation" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="slide-order">Position</Label>
          <Input id="slide-order" name="sortOrder" type="number" min={0} defaultValue={slide?.sortOrder ?? nextPosition} />
        </div>
        <label className="flex items-center gap-3 self-end pb-2.5 text-sm font-medium">
          <input type="checkbox" name="isPublished" defaultChecked={slide?.isPublished ?? true} className="size-4 accent-brand-600" />
          Show on the website
        </label>
      </div>

      <KeepValuesOnError state={state} failed={Boolean(state.error)} />
      {state.error && (
        <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-800">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <SaveButton disabled={pending}>
          {pending ? "Saving…" : slide ? "Save changes" : "Add slide"}
        </SaveButton>
        {slide && (
          <Link href="/dashboard/slides" className={buttonStyles({ variant: "ghost" })}>
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
