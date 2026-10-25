"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { KeepValuesOnError } from "@/components/ui/keep-values-on-error";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { addLead, saveRouting, updateLead } from "./actions";
import { courseLevelOptions, leadStatusLabels } from "./labels";

type Option = { id: string; name: string };

export function NewLeadForm({ countries }: { countries: Option[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addLead, {});

  return (
    <form action={action} className="grid gap-4">
      <div>
        <Label htmlFor="l-name">Name</Label>
        <Input id="l-name" name="name" maxLength={100} required />
      </div>
      <div>
        <Label htmlFor="l-email">Email</Label>
        <Input id="l-email" name="email" type="email" maxLength={254} required />
      </div>
      <div>
        <Label htmlFor="l-phone">Phone</Label>
        <Input id="l-phone" name="phone" type="tel" maxLength={30} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="l-country">Lives in</Label>
          <Select id="l-country" name="countryId" defaultValue="">
            <option value="">Not known</option>
            {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="l-destination">Wants to study in</Label>
          <Select id="l-destination" name="destinationCountryId" defaultValue="">
            <option value="">Not decided</option>
            {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="l-level">Study level</Label>
        <Select id="l-level" name="studyLevel" defaultValue="">
          <option value="">Not known</option>
          {courseLevelOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </Select>
      </div>
      <div>
        <Label htmlFor="l-message">What they asked about</Label>
        <Textarea id="l-message" name="message" maxLength={3000} placeholder="Phone call, walk-in, Facebook message…" />
      </div>
      <FormMessage state={state} />
      <SaveButton disabled={pending} className="justify-self-start">{pending ? "Adding…" : "Add lead"}</SaveButton>
    </form>
  );
}

type LeadUpdateProps = {
  lead: { id: string; status: string; assignedStaffId: string | null; assignedAgentId: string | null };
  staff: Option[];
  agents: Option[];
};

export function LeadUpdateForm({ lead, staff, agents }: LeadUpdateProps) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateLead, {});

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={lead.id} />
      <div>
        <Label htmlFor="l-status">Status</Label>
        <Select id="l-status" name="status" defaultValue={lead.status}>
          {Object.entries(leadStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
      </div>
      <div>
        <Label htmlFor="l-staff">Counsellor</Label>
        <Select id="l-staff" name="assignedStaffId" defaultValue={lead.assignedStaffId ?? ""}>
          <option value="">Not assigned</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>
      <div>
        <Label htmlFor="l-agent">Agent</Label>
        <Select id="l-agent" name="assignedAgentId" defaultValue={lead.assignedAgentId ?? ""}>
          <option value="">None</option>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
      </div>
      <FormMessage state={state} />
      <SaveButton disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Save"}</SaveButton>
    </form>
  );
}

type RoutingProps = {
  // A fixed country row, or a dropdown of `countries` for adding one.
  country: Option | null;
  countries?: Option[];
  staffId: string | null;
  agentId: string | null;
  staff: Option[];
  agents: Option[];
};

export function RoutingForm({ country, countries = [], staffId, agentId, staff, agents }: RoutingProps) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveRouting, {});
  const name = country?.name ?? "the chosen country";

  return (
    <form action={action} className="grid items-end gap-3 sm:grid-cols-[10rem_1fr_1fr_auto]">
      {country ? (
        <>
          <input type="hidden" name="countryId" value={country.id} />
          <p className="font-semibold sm:pb-2.5">{country.name}</p>
        </>
      ) : (
        <Select name="countryId" defaultValue="" aria-label="Country" required>
          <option value="" disabled>Country…</option>
          {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      )}
      <Select name="staffId" defaultValue={staffId ?? ""} aria-label={`Counsellor for ${name}`}>
        <option value="">No counsellor</option>
        {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Select>
      <Select name="agentId" defaultValue={agentId ?? ""} aria-label={`Agent for ${name}`}>
        <option value="">No agent</option>
        {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </Select>
      <SaveButton size="sm" variant="glass" disabled={pending}>{pending ? "Saving…" : state.saved ? "Saved ✓" : "Save"}</SaveButton>
      <KeepValuesOnError state={state} failed={Boolean(state.error)} />
      {state.error && <div className="sm:col-span-4"><FormMessage state={state} /></div>}
    </form>
  );
}
