"use client";

import { useActionState, useTransition, useState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Input, Label, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { resendEmail, saveEmailSettings } from "./actions";

type Props = {
  domain: string;
  fromName: string;
  fromAddress: string;
  replyTo: string;
  alerts: { key: string; label: string; hint: string; value: string }[];
  countryInboxes: string;
};

export function EmailSettingsForm(props: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveEmailSettings, {});

  return (
    <form action={action} className="grid gap-6">
      <section className="grid gap-4">
        <h3 className="font-semibold">Sender</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="e-name">Sender name</Label>
            <Input id="e-name" name="fromName" defaultValue={props.fromName} maxLength={80} required />
          </div>
          <div>
            <Label htmlFor="e-from">Send from</Label>
            <Input id="e-from" name="fromAddress" type="email" defaultValue={props.fromAddress} maxLength={120} required placeholder={props.domain ? `info@${props.domain}` : ""} />
          </div>
          <div>
            <Label htmlFor="e-reply">Replies go to</Label>
            <Input id="e-reply" name="replyTo" type="email" defaultValue={props.replyTo} maxLength={120} placeholder="Optional" />
          </div>
        </div>
        <p className="text-sm text-muted">
          {props.domain ? <>The sending address must end with <strong>@{props.domain}</strong>. </> : null}
          When someone replies to an email from the site, the reply goes to the &quot;Replies go to&quot; address (or straight to the staff member, for emails they sent).
        </p>
      </section>

      <section className="grid gap-4">
        <h3 className="font-semibold">Staff alerts</h3>
        <p className="-mt-2 text-sm text-muted">Used when nobody is assigned yet. One or more addresses, separated by commas or new lines.</p>
        <div className="grid gap-4 lg:grid-cols-3">
          {props.alerts.map((alert) => (
            <div key={alert.key}>
              <Label htmlFor={`e-${alert.key}`}>{alert.label}</Label>
              <Textarea id={`e-${alert.key}`} name={`alert-${alert.key}`} defaultValue={alert.value} className="min-h-20 text-sm" spellCheck={false} />
              <p className="mt-1 text-xs text-muted">{alert.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-2">
        <h3 className="font-semibold">Country inboxes</h3>
        <p className="text-sm text-muted">
          Each new lead from that country is also copied to its office inbox. One per line, as{" "}
          <code className="rounded bg-brand-900/5 px-1">Bangladesh | bd@{props.domain || "example.com"}</code>.
        </p>
        <Textarea name="countryInboxes" defaultValue={props.countryInboxes} className="min-h-28 font-mono text-xs" spellCheck={false} aria-label="Country inboxes" />
      </section>

      <FormMessage state={state} />
      <SaveButton disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Save email settings"}</SaveButton>
    </form>
  );
}

export function ResendButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>({});
  return (
    <div className="grid gap-2">
      <Button type="button" size="sm" variant="glass" disabled={pending} className="justify-self-start" onClick={() => start(async () => setState(await resendEmail(id)))}>
        {pending ? "Sending…" : "Send again"}
      </Button>
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      {state.saved && <p role="status" className="text-sm text-emerald-700">Sent again. It is at the top of the list.</p>}
    </div>
  );
}
