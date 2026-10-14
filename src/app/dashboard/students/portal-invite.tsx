"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { makePortalInvite } from "./actions";
import type { InviteState } from "./actions";

export function PortalInvite({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState<InviteState, FormData>(makePortalInvite, {});
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!state.url) return;
    await navigator.clipboard.writeText(state.url).catch(() => {});
    setCopied(true);
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted">
        This student has no password yet. Make a link and send it to them by email or WhatsApp. It works once and expires in 7 days; a new link cancels the old one.
      </p>
      {state.url && (
        <div className="grid gap-2">
          <Input value={state.url} readOnly aria-label="Invite link" onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
          <Button type="button" size="sm" variant="glass" onClick={copy} className="justify-self-start">{copied ? "Copied ✓" : "Copy link"}</Button>
        </div>
      )}
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <form action={action}>
        <input type="hidden" name="studentId" value={studentId} />
        <Button size="sm" disabled={pending} onClick={() => setCopied(false)}>{pending ? "Making…" : state.url ? "Make a new link" : "Make invite link"}</Button>
      </form>
    </div>
  );
}
