"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

export type ChatOption = { kind: "whatsapp" | "messenger" | "site"; label: string; hint: string; href: string };

function WhatsAppLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5 fill-current">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.8h-.01a9.9 9.9 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 0 1 7 2.9 9.82 9.82 0 0 1 2.9 6.99c0 5.45-4.44 9.88-9.9 9.88zm8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.17-1.24-6.16-3.48-8.4z" />
    </svg>
  );
}

function MessengerLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5 fill-current">
      <path d="M12 0C5.24 0 0 4.95 0 11.64c0 3.5 1.43 6.52 3.77 8.61.2.18.31.42.32.69l.07 2.13a.96.96 0 0 0 1.35.85l2.38-1.05c.2-.09.43-.1.64-.05 1.09.3 2.26.46 3.47.46 6.76 0 12-4.95 12-11.64S18.76 0 12 0zm7.2 8.96-3.52 5.59a1.8 1.8 0 0 1-2.6.48l-2.8-2.1a.72.72 0 0 0-.87 0l-3.79 2.88c-.5.38-1.17-.22-.83-.76l3.52-5.59a1.8 1.8 0 0 1 2.6-.48l2.8 2.1c.26.19.61.19.87 0l3.79-2.88c.5-.38 1.17.22.83.76z" />
    </svg>
  );
}

const styles: Record<ChatOption["kind"], string> = {
  whatsapp: "bg-[#25D366] text-white",
  messenger: "bg-linear-to-br from-[#00B2FF] to-[#A033FF] text-white",
  site: "bg-brand-600 text-white",
};

export function ChatLauncher({ options }: { options: ChatOption[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onClick = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  if (options.length === 0) return null;

  return (
    <div ref={box} className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div id="chat-options" className="w-72 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-brand-900/10 bg-white p-2 shadow-2xl">
          <p className="px-3 pb-1 pt-2 text-sm font-semibold text-brand-900">How would you like to talk to us?</p>
          <ul>
            {options.map((option) => {
              const inner = (
                <>
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", styles[option.kind])}>
                    {option.kind === "whatsapp" ? <WhatsAppLogo /> : option.kind === "messenger" ? <MessengerLogo /> : <Icon name="chat" className="size-5" />}
                  </span>
                  <span className="grid">
                    <span className="text-sm font-semibold text-brand-900">{option.label}</span>
                    <span className="text-xs text-muted">{option.hint}</span>
                  </span>
                </>
              );
              const className = "flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-brand-600/8";
              return (
                <li key={option.kind}>
                  {option.kind === "site" ? (
                    <Link href={option.href} className={className} onClick={() => setOpen(false)}>{inner}</Link>
                  ) : (
                    <a href={option.href} target="_blank" rel="noopener noreferrer" className={className} onClick={() => setOpen(false)}>{inner}</a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="chat-options"
        aria-label={open ? "Close chat options" : "Chat with us"}
        className="flex size-14 items-center justify-center rounded-full bg-linear-to-br from-brand-600 to-sky-500 text-white shadow-lg shadow-brand-600/40 transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        <Icon name={open ? "close" : "chat"} className="size-6" />
      </button>
    </div>
  );
}
