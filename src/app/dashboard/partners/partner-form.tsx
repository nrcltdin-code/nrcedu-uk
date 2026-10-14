"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Checkbox, FormMessage } from "@/components/dashboard/form-bits";
import { ImageField } from "@/components/dashboard/image-field";
import { Button, buttonStyles } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { savePartner } from "./actions";

type PartnerValues = { id: string; name: string; logoUrl: string | null; website: string | null; isPublished: boolean };

export function PartnerForm({ partner }: { partner: PartnerValues | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePartner, {});

  return (
    <form action={action} className="grid gap-4">
      {partner && <input type="hidden" name="id" value={partner.id} />}
      <div>
        <Label htmlFor="p-name">Name</Label>
        <Input id="p-name" name="name" defaultValue={partner?.name} maxLength={150} required />
      </div>
      <ImageField name="logoUrl" label="Logo" defaultValue={partner?.logoUrl} fit="contain" hint="A logo on a transparent or white background works best. Up to 4 MB." />
      <div>
        <Label htmlFor="p-website">Website</Label>
        <Input id="p-website" name="website" type="url" defaultValue={partner?.website ?? ""} placeholder="https://…" />
      </div>
      <Checkbox name="isPublished" defaultChecked={partner?.isPublished ?? true}>Show on the website</Checkbox>
      <FormMessage state={state} />
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : partner ? "Save changes" : "Add partner"}</Button>
        {partner && <Link href="/dashboard/partners" className={buttonStyles({ variant: "ghost" })}>Cancel</Link>}
      </div>
    </form>
  );
}
