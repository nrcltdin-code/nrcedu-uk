"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FormMessage } from "@/components/dashboard/form-bits";
import { ImageField } from "@/components/dashboard/image-field";
import { Button, buttonStyles } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { saveSubject } from "./actions";

type SubjectValues = { id: string; name: string; slug: string; description: string | null; imageUrl: string | null };

export function SubjectForm({ subject }: { subject: SubjectValues | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSubject, {});

  return (
    <form action={action} className="grid gap-4">
      {subject && <input type="hidden" name="id" value={subject.id} />}
      <div>
        <Label htmlFor="subject-name">Name</Label>
        <Input id="subject-name" name="name" defaultValue={subject?.name} maxLength={100} required />
      </div>
      <div>
        <Label htmlFor="subject-slug">Web address</Label>
        <Input id="subject-slug" name="slug" defaultValue={subject?.slug} placeholder="Made from the name if left empty" />
        <p className="mt-1.5 text-xs text-muted">Shown as /subjects/<em>address</em>. Changing it breaks old links.</p>
      </div>
      <div>
        <Label htmlFor="subject-description">Description</Label>
        <Textarea id="subject-description" name="description" defaultValue={subject?.description ?? ""} maxLength={2000} />
      </div>
      <ImageField name="imageUrl" label="Image" defaultValue={subject?.imageUrl} />
      <FormMessage state={state} />
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : subject ? "Save changes" : "Add subject"}</Button>
        {subject && <Link href="/dashboard/subjects" className={buttonStyles({ variant: "ghost" })}>Cancel</Link>}
      </div>
    </form>
  );
}
