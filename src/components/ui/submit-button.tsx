"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

// A submit button for forms whose action is a plain server action (no useActionState): it shows
// `pendingText` and stops a second click while the action runs.
export function SubmitButton({ pendingText, children, disabled, ...props }: ComponentProps<typeof Button> & { pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
