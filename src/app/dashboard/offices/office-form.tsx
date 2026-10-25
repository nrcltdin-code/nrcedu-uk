"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Checkbox, FormMessage } from "@/components/dashboard/form-bits";
import { ImageField } from "@/components/dashboard/image-field";
import { Button, buttonStyles } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Input, Label, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { saveOffice } from "./actions";

type OfficeValues = {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  phone: string | null;
  email: string | null;
  openingHours: string | null;
  mapUrl: string | null;
  imageUrl: string | null;
  isHeadOffice: boolean;
  isPublished: boolean;
};

export function OfficeForm({ office }: { office: OfficeValues | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveOffice, {});

  return (
    <form action={action} className="grid gap-4">
      {office && <input type="hidden" name="id" value={office.id} />}
      <div>
        <Label htmlFor="o-name">Office name</Label>
        <Input id="o-name" name="name" defaultValue={office?.name} maxLength={120} placeholder="London office" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="o-city">City</Label>
          <Input id="o-city" name="city" defaultValue={office?.city} maxLength={80} required />
        </div>
        <div>
          <Label htmlFor="o-country">Country</Label>
          <Input id="o-country" name="country" defaultValue={office?.country} maxLength={80} required />
        </div>
      </div>
      <div>
        <Label htmlFor="o-address">Address</Label>
        <Textarea id="o-address" name="address" defaultValue={office?.address} maxLength={300} className="min-h-20" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="o-phone">Phone</Label>
          <Input id="o-phone" name="phone" type="tel" defaultValue={office?.phone ?? ""} maxLength={25} />
        </div>
        <div>
          <Label htmlFor="o-email">Email</Label>
          <Input id="o-email" name="email" type="email" defaultValue={office?.email ?? ""} maxLength={120} />
        </div>
      </div>
      <div>
        <Label htmlFor="o-hours">Opening hours</Label>
        <Input id="o-hours" name="openingHours" defaultValue={office?.openingHours ?? ""} maxLength={120} placeholder="Mon–Fri 9:30–18:00" />
      </div>
      <div>
        <Label htmlFor="o-map">Map link</Label>
        <Input id="o-map" name="mapUrl" type="url" defaultValue={office?.mapUrl ?? ""} placeholder="https://maps.google.com/…" />
      </div>
      <ImageField name="imageUrl" label="Photo" defaultValue={office?.imageUrl} />
      <Checkbox name="isHeadOffice" defaultChecked={office?.isHeadOffice}>Head office (always shown first)</Checkbox>
      <Checkbox name="isPublished" defaultChecked={office?.isPublished ?? true}>Show on the website</Checkbox>
      <FormMessage state={state} />
      <div className="flex gap-3">
        <SaveButton disabled={pending}>{pending ? "Saving…" : office ? "Save changes" : "Add office"}</SaveButton>
        {office && <Link href="/dashboard/offices" className={buttonStyles({ variant: "ghost" })}>Cancel</Link>}
      </div>
    </form>
  );
}
