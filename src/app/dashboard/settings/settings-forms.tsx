"use client";

import { useActionState } from "react";
import { ImageField } from "@/components/dashboard/image-field";
import { FormMessage } from "@/components/dashboard/form-bits";
import { SaveButton } from "@/components/ui/save-button";
import { Input, Label, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import type { ContactSettings, SocialSettings, WelcomeSettings } from "@/lib/settings";
import { saveContact, saveMenus, saveSocial, saveWelcome } from "./actions";

export function WelcomeForm({ welcome }: { welcome: WelcomeSettings }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveWelcome, {});

  return (
    <form action={action} className="grid gap-4">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="enabled" defaultChecked={welcome.enabled} className="size-4" />
        Show this popup to visitors
      </label>
      <p className="-mt-2 text-sm text-muted">
        Shown once per visit. After a visitor closes it, it stays hidden until their next visit, or until you change it.
      </p>
      <div>
        <Label htmlFor="w-title">Title</Label>
        <Input id="w-title" name="title" defaultValue={welcome.title} maxLength={120} />
      </div>
      <div>
        <Label htmlFor="w-message">Message</Label>
        <Textarea id="w-message" name="message" defaultValue={welcome.message} maxLength={1000} className="min-h-24" />
      </div>
      <ImageField name="imageUrl" label="Image" defaultValue={welcome.imageUrl} hint="Optional. Shown at the top of the popup. A wide image (about 1200 × 630 px) works best." />
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="w-button">Close button label</Label>
          <Input id="w-button" name="buttonLabel" defaultValue={welcome.buttonLabel} maxLength={40} placeholder="Close" />
        </div>
        <div>
          <Label htmlFor="w-link-label">Link button label</Label>
          <Input id="w-link-label" name="linkLabel" defaultValue={welcome.linkLabel} maxLength={40} placeholder="Optional" />
        </div>
        <div>
          <Label htmlFor="w-link">Link button goes to</Label>
          <Input id="w-link" name="linkHref" defaultValue={welcome.linkHref} maxLength={300} placeholder="/contact or https://…" />
        </div>
      </div>
      <FormMessage state={state} />
      <SaveButton disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Save welcome popup"}</SaveButton>
    </form>
  );
}

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
        <div>
          <Label htmlFor="s-messenger">Messenger (Facebook page)</Label>
          <Input id="s-messenger" name="messenger" defaultValue={contact.messenger} maxLength={80} placeholder="e.g. nrcedu or m.me/nrcedu" />
          <p className="mt-1 text-xs text-muted">Optional. Left empty, the Facebook link from social links is used.</p>
        </div>
      </div>
      <div>
        <Label htmlFor="s-address">Main office address</Label>
        <Textarea id="s-address" name="address" defaultValue={contact.address} maxLength={300} className="min-h-20" placeholder="Optional" />
      </div>
      <div>
        <Label htmlFor="s-review">Google review link</Label>
        <Input id="s-review" name="reviewLink" type="url" defaultValue={contact.reviewLink} maxLength={300} placeholder="https://g.page/r/.../review" />
        <p className="mt-1 text-xs text-muted">From &quot;Ask for reviews&quot; on your Google Business Profile. Use {"{review_link}"} in email templates.</p>
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
