"use client";

import { useActionState } from "react";
import { FormError, FormSuccess, SpamTrap } from "@/components/site/form-parts";
import { KeepValuesOnError } from "@/components/ui/keep-values-on-error";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { sendContactMessage } from "./actions";
import type { ContactFormState } from "./actions";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactFormState, FormData>(sendContactMessage, { status: "idle" });

  if (state.status === "sent") {
    return <FormSuccess title="Message sent">Thank you. One of our counsellors will reply to you soon.</FormSuccess>;
  }

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-name">Full name</Label>
          <Input id="contact-name" name="name" autoComplete="name" maxLength={100} required />
        </div>
        <div>
          <Label htmlFor="contact-phone">Phone (optional)</Label>
          <Input id="contact-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} />
        </div>
      </div>
      <div>
        <Label htmlFor="contact-email">Email</Label>
        <Input id="contact-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="contact-message">Message</Label>
        <Textarea id="contact-message" name="message" minLength={10} maxLength={2000} required />
      </div>
      <SpamTrap />

      <KeepValuesOnError state={state} failed={state.status === "error"} />
      {state.status === "error" && <FormError>{state.error}</FormError>}

      <Button type="submit" variant="accent" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
