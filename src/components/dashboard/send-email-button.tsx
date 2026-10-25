"use client";

import { useActionState, useState } from "react";
import { sendPersonalEmail } from "@/app/dashboard/emails/compose-actions";
import { FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import type { FormState } from "@/lib/form";

export type TemplateOption = { id: string; name: string; subject: string; body: string };

type Props = {
  target: "lead" | "student" | "agent";
  id: string;
  recipient: { name: string; email: string };
  myName: string;
  portalLink: string;
  reviewLink: string;
  templates: TemplateOption[];
};

// "Send email" button that opens a panel to write to one person, optionally from a template.
export function SendEmailButton({ target, id, recipient, myName, portalLink, reviewLink, templates }: Props) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  // Close and clear once sent.
  const [state, action, pending] = useActionState<FormState, FormData>(async (previous, form) => {
    const result = await sendPersonalEmail(previous, form);
    if (result.saved) {
      setOpen(false);
      setSubject("");
      setBody("");
      toast(`Email sent to ${recipient.email}`);
    }
    return result;
  }, {});

  const fill = (value: string) =>
    value
      .replaceAll("{first_name}", recipient.name.split(/\s+/)[0] ?? recipient.name)
      .replaceAll("{name}", recipient.name)
      .replaceAll("{my_name}", myName)
      .replaceAll("{portal_link}", portalLink)
      // Left as is when no link is saved, so sending is blocked until it is filled in.
      .replaceAll("{review_link}", reviewLink || "{review_link}");

  function applyTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    if ((subject || body) && !window.confirm("Replace what you have written with this template?")) return;
    setSubject(fill(template.subject));
    setBody(fill(template.body));
  }

  return (
    <>
      <Button type="button" size="sm" variant="glass" onClick={() => setOpen(true)}>Send email</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title={`Email ${recipient.name}`} description={`To ${recipient.email}. Replies come to your own inbox.`}>
        <form action={action} className="grid gap-4">
          <input type="hidden" name="target" value={target} />
          <input type="hidden" name="id" value={id} />
          {templates.length > 0 && (
            <div>
              <Label htmlFor={`tpl-${id}`}>Start from a template</Label>
              <Select id={`tpl-${id}`} value="" onChange={(event) => applyTemplate(event.target.value)}>
                <option value="">Choose a template…</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor={`subj-${id}`}>Subject</Label>
            <Input id={`subj-${id}`} name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} required />
          </div>
          <div>
            <Label htmlFor={`body-${id}`}>Message</Label>
            <Textarea id={`body-${id}`} name="body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={10000} className="min-h-72" required />
          </div>
          <p className="text-xs text-muted">
            Sent from the NRC address with your name in the reply-to.{target !== "agent" && " A copy is saved in the notes."}
          </p>
          {state.error && <FormMessage state={state} />}
          <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Sending…" : "Send email"}</Button>
        </form>
      </Drawer>
    </>
  );
}
