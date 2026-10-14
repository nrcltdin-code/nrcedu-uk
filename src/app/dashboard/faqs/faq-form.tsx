"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Checkbox, FormMessage } from "@/components/dashboard/form-bits";
import { Button, buttonStyles } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { saveFaq } from "./actions";

type FaqValues = { id: string; question: string; answer: string; category: string | null; isPublished: boolean };

export function FaqForm({ faq }: { faq: FaqValues | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveFaq, {});

  return (
    <form action={action} className="grid gap-4">
      {faq && <input type="hidden" name="id" value={faq.id} />}
      <div>
        <Label htmlFor="faq-question">Question</Label>
        <Input id="faq-question" name="question" defaultValue={faq?.question} maxLength={300} required />
      </div>
      <div>
        <Label htmlFor="faq-answer">Answer</Label>
        <Textarea id="faq-answer" name="answer" defaultValue={faq?.answer} maxLength={3000} required className="min-h-36" />
      </div>
      <div>
        <Label htmlFor="faq-category">Category</Label>
        <Input id="faq-category" name="category" defaultValue={faq?.category ?? ""} maxLength={60} placeholder="Optional, e.g. Visas" />
      </div>
      <Checkbox name="isPublished" defaultChecked={faq?.isPublished ?? true}>Show on the website</Checkbox>
      <FormMessage state={state} />
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : faq ? "Save changes" : "Add question"}</Button>
        {faq && <Link href="/dashboard/faqs" className={buttonStyles({ variant: "ghost" })}>Cancel</Link>}
      </div>
    </form>
  );
}
