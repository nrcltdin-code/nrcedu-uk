"use client";

import { useActionState, useTransition } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { KeepValuesOnError } from "@/components/ui/keep-values-on-error";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { DecisionForm, FileReview } from "@/components/dashboard/decision-form";
import type { FormState } from "@/lib/form";
import { cancelAgentDocumentRequest, decideAgencyUpgrade, decideAgentProfile, requestAgentDocument, reviewAgentDocument } from "./actions";

export function AgentDocumentReview({ id }: { id: string }) {
  return <FileReview action={reviewAgentDocument} id={id} sendBackLabel="Send back" notePlaceholder="e.g. The ID has expired" />;
}

export function AgentDecisionForm({ id, approved }: { id: string; approved: boolean }) {
  if (approved) {
    return (
      <DecisionForm
        action={decideAgentProfile}
        hidden={{ id }}
        destructive={{ value: "REJECTED", label: "Revoke access" }}
        notePlaceholder="Why access is being removed (sent to the agent)"
      />
    );
  }
  return (
    <DecisionForm
      action={decideAgentProfile}
      hidden={{ id }}
      approve={{ label: "Approve agent", hint: "Gives them the full agent portal." }}
      sendBack={[{ value: "CHANGES_REQUESTED", label: "Ask for changes" }]}
      destructive={{ value: "REJECTED", label: "Reject" }}
      notePlaceholder="What to change, or why you are rejecting (sent to the agent)"
    />
  );
}

export function AgencyUpgradeForm({ id }: { id: string }) {
  return (
    <DecisionForm
      action={decideAgencyUpgrade}
      hidden={{ id }}
      approve={{ label: "Make agency", hint: "The Team page appears for them." }}
      sendBack={[{ value: "CHANGES_REQUESTED", label: "Ask for changes" }]}
      destructive={{ value: "REJECTED", label: "Decline" }}
      notePlaceholder="What to change, or why you are declining (sent to the agent)"
    />
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
      <SaveButton variant="glass" disabled={pending} className="justify-self-start">{pending ? "Sending…" : "Ask the agent"}</SaveButton>
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
