"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Checkbox, FormMessage } from "@/components/dashboard/form-bits";
import { ImageField } from "@/components/dashboard/image-field";
import { Button, buttonStyles } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { saveTestimonial } from "./actions";

type TestimonialValues = {
  id: string;
  name: string;
  headline: string | null;
  quote: string;
  photoUrl: string | null;
  rating: number | null;
  isPublished: boolean;
};

export function TestimonialForm({ testimonial }: { testimonial: TestimonialValues | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveTestimonial, {});

  return (
    <form action={action} className="grid gap-4">
      {testimonial && <input type="hidden" name="id" value={testimonial.id} />}
      <div>
        <Label htmlFor="t-name">Student name</Label>
        <Input id="t-name" name="name" defaultValue={testimonial?.name} maxLength={100} required />
      </div>
      <div>
        <Label htmlFor="t-headline">Line under the name</Label>
        <Input id="t-headline" name="headline" defaultValue={testimonial?.headline ?? ""} maxLength={150} placeholder="MSc Finance, University of Leeds" />
      </div>
      <div>
        <Label htmlFor="t-quote">What they said</Label>
        <Textarea id="t-quote" name="quote" defaultValue={testimonial?.quote} maxLength={1000} required />
      </div>
      <div className="grid gap-4">
        <div>
          <Label htmlFor="t-rating">Rating</Label>
          <Select id="t-rating" name="rating" defaultValue={testimonial?.rating?.toString() ?? "5"}>
            <option value="">No rating</option>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
          </Select>
        </div>
      </div>
      <ImageField name="photoUrl" label="Photo" defaultValue={testimonial?.photoUrl} />
      <Checkbox name="isPublished" defaultChecked={testimonial?.isPublished ?? true}>Show on the website</Checkbox>
      <FormMessage state={state} />
      <div className="flex gap-3">
        <SaveButton disabled={pending}>{pending ? "Saving…" : testimonial ? "Save changes" : "Add testimonial"}</SaveButton>
        {testimonial && <Link href="/dashboard/testimonials" className={buttonStyles({ variant: "ghost" })}>Cancel</Link>}
      </div>
    </form>
  );
}
