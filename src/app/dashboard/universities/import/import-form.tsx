"use client";

import { useActionState } from "react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { SaveButton } from "@/components/ui/save-button";
import type { ImportResult } from "@/lib/university-import";
import { importUniversitiesCsv } from "./actions";

export function ImportForm() {
  const [state, action, pending] = useActionState(importUniversitiesCsv, {} as ImportResult);

  return (
    <form action={action} className="grid gap-4">
      <div>
        <Label htmlFor="import-file">CSV file</Label>
        <Input id="import-file" name="file" type="file" accept=".csv,text/csv" required disabled={pending} />
      </div>
      <div className="flex flex-wrap gap-3">
        <SaveButton disabled={pending} aria-busy={pending}>
          {pending && <span aria-hidden className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent align-[-2px]" />}
          {pending ? "Importing…" : "Import"}
        </SaveButton>
        <a href="/templates/university-import-template.csv" download className={buttonStyles({ variant: "glass" })}>Download template</a>
      </div>

      {pending && (
        <p role="status" className="text-sm text-muted">Importing your file. Large files can take a minute, so keep this page open.</p>
      )}
      {!pending && state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {!pending && state.universities && (
        <div role="status" className="rounded-2xl border border-brand-900/10 p-4 text-sm">
          <p className="font-semibold">Import finished</p>
          <ul className="mt-2 list-disc pl-5">
            <li>Universities: {state.universities.created} added, {state.universities.updated} updated</li>
            <li>Courses: {state.courses?.created} added, {state.courses?.updated} updated</li>
            <li>New countries: {state.countries} · New subjects: {state.subjects}</li>
            <li>Required documents added: {state.documents ?? 0} · Intakes added: {state.intakes ?? 0}</li>
            <li>Images saved: {state.images ?? 0}</li>
          </ul>
          {(state.imagesLeft ?? 0) > 0 && (
            <p className="mt-3 font-semibold text-amber-700">
              {state.imagesLeft} images are still waiting. Import the same file again to continue. Finished ones are skipped.
            </p>
          )}
          {state.problems && state.problems.length > 0 && (
            <>
              <p className="mt-3 font-semibold">Rows to check ({state.problems.length})</p>
              <ul className="mt-1 max-h-64 list-disc overflow-auto pl-5 text-muted">
                {state.problems.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </>
          )}
          <p className="mt-3">
            New universities are unpublished. <Link href="/dashboard/universities" className="underline">Review and publish them</Link>.
          </p>
        </div>
      )}
    </form>
  );
}
