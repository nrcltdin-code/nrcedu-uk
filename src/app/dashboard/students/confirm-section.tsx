"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { setSectionConfirmed } from "./actions";

const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" });

// "Confirm" until staff have checked the section, then a green "Confirmed" with who and when.
export function ConfirmSection({ studentId, section, confirmedAt, confirmedBy, canEdit }: {
  studentId: string;
  section: "profile" | "education";
  confirmedAt: Date | null;
  confirmedBy: string | null;
  canEdit: boolean;
}) {
  const [pending, start] = useTransition();
  const label = section === "profile" ? "Profile" : "Education";
  const set = (value: boolean) =>
    start(async () => {
      try {
        await setSectionConfirmed(studentId, section, value);
        toast(value ? `${label} confirmed` : `${label} confirmation undone`);
      } catch {
        toast("Could not save. Please try again.", "error");
      }
    });

  if (confirmedAt) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-600/10 px-3 py-1 text-sm font-semibold text-emerald-700" title={`Confirmed by ${confirmedBy ?? "staff"}, ${day.format(confirmedAt)}`}>
          ✓ Confirmed
          <span className="font-normal text-emerald-700/80"> · {confirmedBy ?? "staff"}, {day.format(confirmedAt)}</span>
        </span>
        {canEdit && (
          <button type="button" onClick={() => set(false)} disabled={pending} className="text-xs text-muted hover:underline">
            Undo
          </button>
        )}
      </span>
    );
  }
  if (!canEdit) return <span className="text-sm text-muted">Not confirmed yet</span>;
  return (
    <Button type="button" size="sm" variant="glass" onClick={() => set(true)} disabled={pending}>
      {pending ? "Saving…" : "Confirm"}
    </Button>
  );
}
