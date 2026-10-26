"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import type { WelcomeSettings } from "@/lib/settings";

const STORAGE_KEY = "welcome-popup-dismissed";

// Short fingerprint of the popup text, so editing it shows the new version to visitors who closed the old one.
function fingerprint(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return String(hash);
}

function dismissedValue() {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// Closing the popup hides it for the rest of the browser session.
export function WelcomePopupDialog({ title, message, buttonLabel, linkLabel, linkHref }: Omit<WelcomeSettings, "enabled">) {
  const version = fingerprint([title, message, buttonLabel, linkLabel, linkHref].join("\n"));
  // Hidden while rendering on the server; the browser then checks sessionStorage.
  const stored = useSyncExternalStore(() => () => {}, dismissedValue, () => version);
  const [closed, setClosed] = useState(false);

  function close() {
    try {
      sessionStorage.setItem(STORAGE_KEY, version);
    } catch {}
    setClosed(true);
  }

  if (stored === version || closed) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-deep-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
        <h2 id="welcome-title" className="text-xl font-bold text-ink">
          {title}
        </h2>
        {message && <p className="mt-3 whitespace-pre-line text-sm text-muted">{message}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {linkHref && linkLabel && (
            <Link href={linkHref} onClick={close} className={buttonStyles({ variant: "accent" })}>
              {linkLabel}
            </Link>
          )}
          <Button variant={linkHref ? "ghost" : "primary"} onClick={close} autoFocus>
            {buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
