"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { FormState } from "@/lib/form";

// Small pop-up messages in the corner. Call toast() from any client component; <Toaster />
// (mounted once in the dashboard shell) shows them for a few seconds.

type Toast = { id: number; message: string; tone: "success" | "error" };

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function toast(message: string, tone: Toast["tone"] = "success") {
  const id = nextId++;
  toasts = [...toasts, { id, message, tone }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((item) => item.id !== id);
    emit();
  }, 3500);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function Toaster() {
  const items = useSyncExternalStore(subscribe, () => toasts, () => toasts);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 p-4">
      {items.map((item) => (
        <div
          key={item.id}
          role={item.tone === "error" ? "alert" : "status"}
          className={`glass-solid pointer-events-auto rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ${item.tone === "error" ? "text-red-800" : "text-emerald-800"}`}
        >
          {item.tone === "error" ? "⚠ " : "✓ "}
          {item.message}
        </div>
      ))}
    </div>
  );
}

// Shows a toast each time a form's server action finishes. useActionState returns a new
// state object per submission, so saving twice in a row still shows the toast again.
export function FormToast({ state }: { state: FormState }) {
  useEffect(() => {
    if (state.error) toast(state.error, "error");
    else if (state.saved) toast("Changes saved");
  }, [state]);
  return null;
}
