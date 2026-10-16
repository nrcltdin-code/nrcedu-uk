"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Admin and staff accounts without two-step sign-in see only the Account page until they set it up.
export function TwoFactorGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard/account")) return children;

  return (
    <Card tone="solid" className="mx-auto mt-10 max-w-lg text-center">
      <h1 className="text-2xl font-bold">Set up two-step sign-in</h1>
      <p className="mt-3 text-muted">
        Admin and staff accounts can see student passports and documents, so they need a code from an authenticator app as well as the password. It takes about a minute.
      </p>
      <Link href="/dashboard/account" className={buttonStyles({ className: "mt-6" })}>
        Set it up now
      </Link>
    </Card>
  );
}
