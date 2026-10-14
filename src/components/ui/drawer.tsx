"use client";

import { useEffect, useId, useRef } from "react";
import type { MouseEvent, PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

// Panel that slides in from the right over the page. Built on <dialog>, so focus is
// trapped inside it, Escape closes it and the page behind cannot be clicked.
export function Drawer({ open, onClose, title, description, children, className }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const pressStartedOnBackdrop = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Start in the first field; otherwise focus lands on the close button, where a
      // stray Enter or Space would close the panel.
      dialog.querySelector<HTMLElement>("input, select, textarea")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // The dimmed area belongs to the dialog element, so a backdrop click is one that targets
  // the dialog itself and lands outside the panel's box.
  function isOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return false;
    const box = event.currentTarget.getBoundingClientRect();
    return (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    );
  }

  function onPointerDown(event: PointerEvent<HTMLDialogElement>) {
    pressStartedOnBackdrop.current = isOnBackdrop(event);
  }

  // Close only on a real press that both starts and ends on the backdrop. This ignores
  // clicks made by scripts or browser autofill, and text selections dragged out of a field.
  function onClick(event: MouseEvent<HTMLDialogElement>) {
    const started = pressStartedOnBackdrop.current;
    pressStartedOnBackdrop.current = false;
    if (started && event.detail > 0 && isOnBackdrop(event)) {
      onClose();
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onPointerDown={onPointerDown}
      onClick={onClick}
      className={cn("drawer glass-solid rounded-l-3xl p-0 text-ink", className)}
    >
      <div className="flex h-full flex-col overflow-y-auto p-6 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-2xl font-bold">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 flex size-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-brand-600/10 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
