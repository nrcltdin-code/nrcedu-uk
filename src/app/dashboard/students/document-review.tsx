"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { KeepValuesOnError } from "@/components/ui/keep-values-on-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { reviewDocument } from "./document-actions";

export function DocumentReview({ id }: { id: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(reviewDocument, {});

  return (
    <form action={action} className="mt-2 grid gap-2">
      <input type="hidden" name="id" value={id} />
      <Input name="note" maxLength={500} placeholder="Note, required when asking again (e.g. page 2 missing)" className="h-9" aria-label="Review note" />
      <div className="flex gap-2">
        <Button size="sm" name="decision" value="APPROVED" disabled={pending}>Approve</Button>
        <Button size="sm" variant="ghost" name="decision" value="REJECTED" disabled={pending} className="text-red-700 hover:bg-red-500/10">
          Ask again
        </Button>
      </div>
      <KeepValuesOnError state={state} failed={Boolean(state.error)} />
      {state.error && <FormMessage state={state} />}
    </form>
  );
}
