"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "maintenance-notice-dismissed";

// Pop-up telling visitors the site is under maintenance. Closing it hides it
// for the rest of the browser session.
export function MaintenanceNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {}
    setOpen(true);
  }, []);

  function close() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-deep-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="maintenance-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
        <h2 id="maintenance-title" className="text-xl font-bold text-ink">
          This website is under maintenance
        </h2>
        <p className="mt-3 text-sm text-muted">
          We are making some improvements, so some pages or features may not
          work as expected. Thank you for your patience.
        </p>
        <Button className="mt-6" onClick={close} autoFocus>
          Got it
        </Button>
      </div>
    </div>
  );
}
