"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

// Shown across the dashboard until the address is confirmed; the link in the email lands back on /dashboard.
export function VerifyEmailBanner({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function resend() {
    setState("sending");
    const { error } = await authClient.sendVerificationEmail({ email, callbackURL: "/dashboard" });
    setState(error ? "error" : "sent");
  }

  return (
    <div role="status" className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
      <p className="flex-1">
        Please confirm your email address: we sent a link to <strong>{email}</strong>.
        {state === "sent" && " A new link is on its way."}
        {state === "error" && " We could not send it just now. Please try again later."}
      </p>
      <button
        type="button"
        onClick={resend}
        disabled={state === "sending" || state === "sent"}
        className="h-9 rounded-full px-4 font-semibold text-amber-900 hover:bg-amber-500/15 disabled:opacity-50"
      >
        {state === "sending" ? "Sending…" : "Send again"}
      </button>
    </div>
  );
}
