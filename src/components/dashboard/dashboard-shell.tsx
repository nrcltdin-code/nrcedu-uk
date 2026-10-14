"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import type { NavGroup } from "@/lib/dashboard-nav";

type ShellProps = {
  nav: NavGroup[];
  user: { name: string; email: string; roleLabel: string };
  children: ReactNode;
};

// Fixed sidebar on large screens; on smaller ones it slides in from the left.
export function DashboardShell({ nav, user, children }: ShellProps) {
  const pathname = usePathname();
  // The mobile menu remembers the page it was opened on, so it closes itself after navigating.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const setOpen = (value: boolean) => setOpenedOn(value ? pathname : null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpenedOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex min-h-dvh">
      {open && (
        <div className="fixed inset-0 z-30 bg-deep-900/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <aside
        className={cn(
          "bg-deep fixed inset-y-0 left-0 z-40 flex w-64 flex-col text-white transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <Link href="/" className="flex items-center gap-2.5 font-display font-bold">
            <Image src="/nrc-logo.png" alt="" width={40} height={32} />
            NRC Education
          </Link>
          <button type="button" className="rounded-lg p-1.5 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <Icon name="close" className="size-5" />
          </button>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4" aria-label="Dashboard">
          {nav.map((group) => (
            <div key={group.label || "main"} className="mt-4 first:mt-0">
              {group.label && (
                <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-white/50">{group.label}</p>
              )}
              <ul className="grid gap-0.5">
                {group.items.map((item) => {
                  const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
                  const inner = (
                    <>
                      <Icon name={item.icon} className="size-5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.soon && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold">Soon</span>}
                    </>
                  );
                  const base = "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium";
                  return (
                    <li key={item.href}>
                      {item.soon ? (
                        <span className={cn(base, "cursor-default text-white/40")}>{inner}</span>
                      ) : (
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(base, active ? "glass-dark text-white" : "text-white/80 hover:bg-white/10 hover:text-white")}
                        >
                          {inner}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/15 px-5 py-4">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-white/60">{user.email}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-20 flex h-16 items-center gap-3 rounded-none border-x-0 border-t-0 px-4 sm:px-6">
          <button type="button" className="rounded-lg p-2 text-brand-800 hover:bg-brand-600/10 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" className="size-5" />
          </button>
          <span className="rounded-full bg-brand-600/12 px-3 py-1 text-xs font-semibold text-brand-800">{user.roleLabel}</span>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/" className="hidden text-sm font-medium text-brand-700 hover:underline sm:inline">
              View website
            </Link>
            <SignOutButton />
          </div>
        </header>
        <div className="flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</div>
      </div>
    </div>
  );
}
