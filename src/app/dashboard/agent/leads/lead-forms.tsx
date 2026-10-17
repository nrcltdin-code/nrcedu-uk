"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { addAgentLead, updateAgentLead } from "./actions";

type Option = { id: string; name: string };
type Level = { value: string; label: string };

export function AddLeadForm({ countries, levels }: { countries: Option[]; levels: Level[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addAgentLead, {});
  return (
    <form action={action} className="grid gap-3">
      <div>
        <Label htmlFor="l-name">Name</Label>
        <Input id="l-name" name="name" maxLength={100} required />
      </div>
      <div>
        <Label htmlFor="l-email">Email</Label>
        <Input id="l-email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="l-phone">Phone or WhatsApp</Label>
        <Input id="l-phone" name="phone" type="tel" maxLength={30} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="l-from">Lives in</Label>
          <Select id="l-from" name="countryId" defaultValue="">
            <option value="">—</option>
            {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="l-to">Wants to study in</Label>
          <Select id="l-to" name="destinationCountryId" defaultValue="">
            <option value="">—</option>
            {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="l-level">Study level</Label>
          <Select id="l-level" name="studyLevel" defaultValue="">
            <option value="">—</option>
            {levels.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="l-follow">Follow up on</Label>
          <Input id="l-follow" name="followUpAt" type="datetime-local" />
        </div>
      </div>
      <div>
        <Label htmlFor="l-msg">What they are looking for</Label>
        <Textarea id="l-msg" name="message" rows={3} maxLength={2000} />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Adding…" : "Add lead"}</Button>
    </form>
  );
}

type LeadValues = { id: string; status: string; followUpAt: string; agentUserId: string | null; converted: boolean };

export function LeadStatusForm({ lead, statuses, people }: { lead: LeadValues; statuses: Level[]; people: Option[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateAgentLead, {});
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="id" value={lead.id} />
      {!lead.converted && (
        <div>
          <Label htmlFor="ls-status">Status</Label>
          <Select id="ls-status" name="status" defaultValue={lead.status}>
            {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
      )}
      <div>
        <Label htmlFor="ls-follow">Follow up on</Label>
        <Input id="ls-follow" name="followUpAt" type="datetime-local" defaultValue={lead.followUpAt} />
      </div>
      {people.length > 1 && (
        <div>
          <Label htmlFor="ls-who">Handled by</Label>
          <Select id="ls-who" name="agentUserId" defaultValue={lead.agentUserId ?? ""}>
            <option value="" disabled>Choose…</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </div>
      )}
      <FormMessage state={state} />
      <Button type="submit" size="sm" disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Save"}</Button>
    </form>
  );
}
