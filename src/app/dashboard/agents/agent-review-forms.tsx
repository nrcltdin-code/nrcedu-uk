"use client";

import { useActionState, useTransition } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { KeepValuesOnError } from "@/components/ui/keep-values-on-error";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { cancelAgentDocumentRequest, decideAgencyUpgrade, decideAgentProfile, requestAgentDocument, reviewAgentDocument } from "./actions";

export function AgentDocumentReview({ id }: { id: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(reviewAgentDocument, {});
  return (
    <form action={action} className="mt-2 grid gap-2">
      <input type="hidden" name="id" value={id} />
      <Input name="note" maxLength={500} placeholder="Note, required when sending back (e.g. expired ID)" className="h-9" aria-label="Review note" />
      <div className="flex gap-2">
        <Button size="sm" name="decision" value="APPROVED" disabled={pending}>Approve</Button>
        <Button size="sm" variant="ghost" name="decision" value="REJECTED" disabled={pending} className="text-red-700 hover:bg-red-500/10">Send back</Button>
      </div>
      <KeepValuesOnError state={state} failed={Boolean(state.error)} />
      {state.error && <FormMessage state={state} />}
    </form>
  );
}

export function AgentDecisionForm({ id, approved }: { id: string; approved: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(decideAgentProfile, {});
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="id" value={id} />
      <div>
        <Label htmlFor="ad-note">Note to the agent</Label>
        <Textarea id="ad-note" name="note" rows={3} maxLength={1000} placeholder="Required when asking for changes or rejecting" />
      </div>
      <FormMessage state={state} />
      <div className="flex flex-wrap gap-2">
        {!approved && <Button name="decision" value="APPROVED" disabled={pending}>Approve</Button>}
        {!approved && <Button name="decision" value="CHANGES_REQUESTED" variant="glass" disabled={pending}>Ask for changes</Button>}
        <Button name="decision" value="REJECTED" variant="ghost" disabled={pending} className="text-red-700 hover:bg-red-500/10">{approved ? "Revoke access" : "Reject"}</Button>
      </div>
    </form>
  );
}

export function AgencyUpgradeForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(decideAgencyUpgrade, {});
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="id" value={id} />
      <div>
        <Label htmlFor="up-note">Note to the agent</Label>
        <Textarea id="up-note" name="note" rows={3} maxLength={1000} placeholder="Required when asking for changes or declining" />
      </div>
      <FormMessage state={state} />
      <div className="flex flex-wrap gap-2">
        <Button name="decision" value="APPROVED" disabled={pending}>Make agency</Button>
        <Button name="decision" value="CHANGES_REQUESTED" variant="glass" disabled={pending}>Ask for changes</Button>
        <Button name="decision" value="REJECTED" variant="ghost" disabled={pending} className="text-red-700 hover:bg-red-500/10">Decline</Button>
      </div>
    </form>
  );
}

export function RequestDocumentForm({ agentId, types }: { agentId: string; types: { value: string; label: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(requestAgentDocument, {});
  return (
    <form action={action} key={state.saved ? "sent" : "form"} className="grid gap-3">
      <input type="hidden" name="agentId" value={agentId} />
      <div>
        <Label htmlFor="rq-type">Kind</Label>
        <Select id="rq-type" name="type" defaultValue="OTHER" required>
          {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
      </div>
      <div>
        <Label htmlFor="rq-label">What you need</Label>
        <Input id="rq-label" name="label" maxLength={120} required placeholder="e.g. Two client references" />
      </div>
      <div>
        <Label htmlFor="rq-help">Instructions (optional)</Label>
        <Textarea id="rq-help" name="instructions" rows={2} maxLength={1000} placeholder="e.g. Signed letters from universities you placed students with" />
      </div>
      <KeepValuesOnError state={state} failed={Boolean(state.error)} />
      <FormMessage state={state} />
      <Button type="submit" variant="glass" disabled={pending} className="justify-self-start">{pending ? "Sending…" : "Ask the agent"}</Button>
    </form>
  );
}

export function CancelRequestButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button size="sm" variant="ghost" disabled={pending} onClick={() => start(() => cancelAgentDocumentRequest(id))}>
      {pending ? "Cancelling…" : "Cancel request"}
    </Button>
  );
}
