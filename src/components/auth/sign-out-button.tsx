"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    const { error } = await authClient.signOut();
    if (error) {
      setPending(false);
      return;
    }
    // A full page load, so no signed-in dashboard data stays in the browser's memory.
    window.location.assign("/");
  }

  return (
    <Button variant="danger" size="sm" onClick={onClick} disabled={pending} aria-busy={pending}>
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
