"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

// A row of cards that is swiped on touch screens and moved with arrow buttons on desktop.
// It never moves by itself. Children should be <li> elements with a fixed share of the width
// and the classes "shrink-0 snap-start".
export function ScrollRow({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLUListElement>(null);

  function scroll(direction: 1 | -1) {
    const row = ref.current;
    if (row) row.scrollBy({ left: direction * row.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <div className={cn("relative", className)}>
      <ul
        ref={ref}
        aria-label={label}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-px-4 px-4 py-4 sm:-mx-6 sm:scroll-px-6 sm:px-6"
      >
        {children}
      </ul>
      <div className="mt-2 flex justify-center gap-3">
        <RowButton label="Scroll back" icon="arrowLeft" onClick={() => scroll(-1)} />
        <RowButton label="Scroll forward" icon="arrowRight" onClick={() => scroll(1)} />
      </div>
    </div>
  );
}

function RowButton({ label, icon, onClick }: { label: string; icon: "arrowLeft" | "arrowRight"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="glass flex size-11 items-center justify-center rounded-full text-brand-700 transition hover:bg-white/80 hover:text-brand-900"
    >
      <Icon name={icon} className="size-5" />
    </button>
  );
}
