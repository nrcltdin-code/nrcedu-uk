"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Input, Label, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import type { ContactSettings, SocialSettings } from "@/lib/settings";
import { saveContact, saveMenus, saveSocial } from "./actions";

export function ContactForm({ contact }: { contact: ContactSettings }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveContact, {});

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="s-phone">Phone</Label>
          <Input id="s-phone" name="phone" type="tel" defaultValue={contact.phone} maxLength={25} required />
        </div>
        <div>
          <Label htmlFor="s-email">Email</Label>
          <Input id="s-email" name="email" type="email" defaultValue={contact.email} maxLength={120} required />
        </div>
        <div>
          <Label htmlFor="s-whatsapp">WhatsApp number</Label>
          <Input id="s-whatsapp" name="whatsapp" type="tel" defaultValue={contact.whatsapp} maxLength={25} placeholder="Optional, with country code" />
        </div>
      </div>
      <div>
        <Label htmlFor="s-address">Main office address</Label>
        <Textarea id="s-address" name="address" defaultValue={contact.address} maxLength={300} className="min-h-20" placeholder="Optional" />
      </div>
      <FormMessage state={state} />
      <SaveButton disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Save contact details"}</SaveButton>
    </form>
  );
}

export function SocialForm({ social, networks }: { social: SocialSettings; networks: readonly { key: string; label: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSocial, {});

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {networks.map(({ key, label }) => (
          <div key={key}>
            <Label htmlFor={`s-${key}`}>{label}</Label>
            <Input id={`s-${key}`} name={key} type="url" defaultValue={social[key as keyof SocialSettings]} maxLength={300} placeholder="https://…" />
          </div>
        ))}
      </div>
      <p className="text-sm text-muted">Leave a box empty to hide that network.</p>
      <FormMessage state={state} />
      <SaveButton disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Save social links"}</SaveButton>
    </form>
  );
}

export function MenusForm({ main, footer }: { main: string; footer: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveMenus, {});

  return (
    <form action={action} className="grid gap-4">
      <p className="text-sm text-muted">
        One link per line, written as <code className="rounded bg-brand-900/5 px-1">Label | /page</code>. Links start with{" "}
        <code className="rounded bg-brand-900/5 px-1">/</code> for pages on this site or{" "}
        <code className="rounded bg-brand-900/5 px-1">https://</code> for other sites. In the footer, a line starting with{" "}
        <code className="rounded bg-brand-900/5 px-1">##</code> begins a new column.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <Label htmlFor="s-main">Main menu (top of every page)</Label>
          <Textarea id="s-main" name="main" defaultValue={main} className="min-h-72 font-mono text-xs" spellCheck={false} required />
        </div>
        <div>
          <Label htmlFor="s-footer">Footer</Label>
          <Textarea id="s-footer" name="footer" defaultValue={footer} className="min-h-72 font-mono text-xs" spellCheck={false} required />
        </div>
      </div>
      <FormMessage state={state} />
      <SaveButton disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Save menus"}</SaveButton>
    </form>
  );
}
