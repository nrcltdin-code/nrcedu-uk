import type { ReactNode } from "react";
import Link from "next/link";
import { Button, buttonStyles } from "@/components/ui/button";
import type { FormState } from "@/lib/form";
import { KeepValuesOnError } from "@/components/ui/keep-values-on-error";
import { FormToast } from "@/components/ui/toaster";
import { SubmitButton } from "@/components/ui/submit-button";

// Shows the result under the form and as a toast, so a save is noticed wherever the button is.
// After an error the form keeps what was typed.
export function FormMessage({ state }: { state: FormState }) {
  return (
    <>
      <KeepValuesOnError state={state} failed={Boolean(state.error)} />
      <FormToast state={state} />
      <InlineMessage state={state} />
    </>
  );
}

function InlineMessage({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-800">
        {state.error}
      </p>
    );
  }
  if (state.saved) {
    return (
      <p role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-800">
        Saved.
      </p>
    );
  }
  return null;
}

export function Checkbox({ name, value, defaultChecked, children }: { name: string; value?: string; defaultChecked?: boolean; children: ReactNode }) {
  return (
    <label className="flex items-center gap-3 text-sm font-medium">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="size-4 accent-brand-600" />
      {children}
    </label>
  );
}

// Two steps, so a record cannot be deleted with one stray click.
export function DeleteButton({ action, question }: { action: () => Promise<void>; question: string }) {
  return (
    <details className="relative">
      <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-full px-4 text-sm font-semibold text-red-700 hover:bg-red-500/10 [&::-webkit-details-marker]:hidden">
        Delete
      </summary>
      <form action={action} className="glass-solid absolute right-0 top-full z-10 mt-1 w-60 rounded-2xl p-3">
        <p className="text-sm">{question}</p>
        <SubmitButton size="sm" pendingText="Deleting…" className="mt-2 bg-red-600 bg-none shadow-none hover:bg-red-700">
          Yes, delete
        </SubmitButton>
      </form>
    </details>
  );
}

type RowControlsProps = {
  editHref: string;
  isPublished: boolean;
  isFirst: boolean;
  isLast: boolean;
  toggle: () => Promise<void>;
  moveUp: () => Promise<void>;
  moveDown: () => Promise<void>;
  remove: () => Promise<void>;
  deleteQuestion: string;
};

// Buttons shown on each row of an ordered list (testimonials, partners, FAQs).
export function RowControls(props: RowControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Link href={props.editHref} className={buttonStyles({ variant: "glass", size: "sm" })}>Edit</Link>
      <form action={props.toggle}>
        <Button variant="ghost" size="sm">{props.isPublished ? "Hide" : "Show"}</Button>
      </form>
      <form action={props.moveUp}>
        <Button variant="ghost" size="sm" disabled={props.isFirst} aria-label="Move up">↑</Button>
      </form>
      <form action={props.moveDown}>
        <Button variant="ghost" size="sm" disabled={props.isLast} aria-label="Move down">↓</Button>
      </form>
      <DeleteButton action={props.remove} question={props.deleteQuestion} />
    </div>
  );
}
