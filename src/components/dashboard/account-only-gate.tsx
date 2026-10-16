"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Until an account meets a requirement (confirmed email, two-step sign-in for staff), the
// dashboard shows only the Account page; every other page shows this card instead.
export function AccountOnlyGate({ title, message, action, children }: { title: string; message: ReactNode; action?: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard/account")) return children;

  return (
    <Card tone="solid" className="mx-auto mt-10 max-w-lg text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="mt-3 text-muted">{message}</div>
      {action ?? (
        <Link href="/dashboard/account" className={buttonStyles({ className: "mt-6" })}>
          Set it up now
        </Link>
      )}
    </Card>
  );
}
