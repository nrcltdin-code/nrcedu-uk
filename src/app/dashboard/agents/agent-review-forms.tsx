"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { decideAgentProfile, reviewAgentDocument } from "./actions";

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
