"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { createApplications } from "@/app/dashboard/applications/actions";
import type { FormState } from "@/lib/form";

// Wraps the per-university sections (rendered on the server) in one form.
export function BulkApplyForm({ studentId, count, children }: { studentId: string; count: number; children: ReactNode }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createApplications, {});
  return (
    <form action={action} className="grid gap-6">
      <input type="hidden" name="studentId" value={studentId} />
      {children}
      <div className="sticky bottom-4 z-10 grid gap-3 rounded-2xl border border-brand-900/10 bg-white/90 p-3 shadow-lg backdrop-blur">
        <FormMessage state={state} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">Each ticked course becomes its own application with that university&apos;s document checklist.</p>
          <Button type="submit" disabled={pending}>{pending ? "Starting…" : `Start ${count === 1 ? "application" : "applications"}`}</Button>
        </div>
      </div>
    </form>
  );
}
