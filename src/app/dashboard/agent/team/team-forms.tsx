"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { FormMessage } from "@/components/dashboard/form-bits";
import { InfoTip } from "@/components/ui/info-tip";
import type { FormState } from "@/lib/form";
import { addTeamMember, reinviteTeamMember, setMemberPermissions, setTeamMemberActive } from "./actions";

export type PermissionOption = { value: string; label: string; help: string };

function PermissionBoxes({ options, checked, idPrefix }: { options: PermissionOption[]; checked: string[]; idPrefix: string }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-semibold">Can</legend>
      {options.map((o) => (
        <span key={o.value} className="flex items-center gap-1">
          <label htmlFor={`${idPrefix}-${o.value}`} className="flex items-center gap-3 text-sm font-medium">
            <input id={`${idPrefix}-${o.value}`} type="checkbox" name="permissions" value={o.value} defaultChecked={checked.includes(o.value)} className="size-4 accent-brand-600" />
            {o.label}
          </label>
          <InfoTip text={o.help} />
        </span>
      ))}
    </fieldset>
  );
}

export function PermissionsForm({ memberId, options, checked }: { memberId: string; options: PermissionOption[]; checked: string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setMemberPermissions, {});
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="memberId" value={memberId} />
      <PermissionBoxes options={options} checked={checked} idPrefix={`p-${memberId}`} />
      <FormMessage state={state} />
      <Button type="submit" size="sm" variant="glass" disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Save access"}</Button>
    </form>
  );
}
import type { TeamInviteState } from "./actions";

function InviteLink({ state }: { state: TeamInviteState }) {
  const [copied, setCopied] = useState(false);
  if (!state.url) return null;
  return (
    <div className="grid gap-2" role="status">
      <p className="text-sm">
        {state.emailedTo ? `Invite emailed to ${state.emailedTo}.` : "Email could not be sent: copy the link and send it yourself."} It works once and expires in 7 days.
      </p>
      <Input value={state.url} readOnly aria-label="Invite link" onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
      <Button
        type="button"
        size="sm"
        variant="glass"
        className="justify-self-start"
        onClick={async () => {
          await navigator.clipboard.writeText(state.url!).catch(() => {});
          setCopied(true);
        }}
      >
        {copied ? "Copied ✓" : "Copy link"}
      </Button>
    </div>
  );
}

export function AddTeamMemberForm({ options }: { options: PermissionOption[] }) {
  const [state, action, pending] = useActionState<TeamInviteState, FormData>(addTeamMember, {});
  return (
    <div className="grid gap-4">
      <form action={action} className="grid gap-4">
        <div>
          <Label htmlFor="tm-name">Full name</Label>
          <Input id="tm-name" name="name" maxLength={100} required />
        </div>
        <div>
          <Label htmlFor="tm-email">Email</Label>
          <Input id="tm-email" name="email" type="email" maxLength={254} required />
        </div>
        <div>
          <Label htmlFor="tm-phone">Phone</Label>
          <Input id="tm-phone" name="phone" type="tel" maxLength={30} />
        </div>
        <PermissionBoxes options={options} checked={["APPLICATIONS", "DOCUMENTS"]} idPrefix="new" />
        {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
        <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Adding…" : "Add team member"}</Button>
      </form>
      <InviteLink state={state} />
    </div>
  );
}

export function ReinviteButton({ memberId }: { memberId: string }) {
  const [state, action, pending] = useActionState<TeamInviteState, FormData>(reinviteTeamMember, {});
  return (
    <div className="grid gap-2">
      <form action={action}>
        <input type="hidden" name="memberId" value={memberId} />
        <Button size="sm" variant="glass" disabled={pending}>{pending ? "Making…" : state.url ? "Make a new invite" : "Send invite again"}</Button>
      </form>
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <InviteLink state={state} />
    </div>
  );
}

export function AccessButton({ memberId, active }: { memberId: string; active: boolean }) {
  const [pending, setPending] = useState(false);
  return (
    <Button
      size="sm"
      variant="glass"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await setTeamMemberActive(memberId, !active);
        setPending(false);
      }}
    >
      {active ? "Turn off access" : "Turn on access"}
    </Button>
  );
}
