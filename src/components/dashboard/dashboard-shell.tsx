"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PageHelpButton } from "@/components/dashboard/page-help-button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import type { NavGroup, NavItem } from "@/lib/dashboard-nav";
import type { Role } from "@/generated/prisma/client";

type ShellProps = {
  nav: NavGroup[];
  user: { name: string; email: string; role: Role; roleLabel: string };
  unreadNotifications: number;
  children: ReactNode;
};

// Fixed sidebar on large screens; on smaller ones it slides in from the left.
export function DashboardShell({ nav, user, unreadNotifications, children }: ShellProps) {
  const pathname = usePathname();
  // The mobile menu remembers the page it was opened on, so it closes itself after navigating.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  // Collapsible groups the person folded (true) or unfolded (false) by hand.
  const [folded, setFolded] = useState<Record<string, boolean>>({});
  const setOpen = (value: boolean) => setOpenedOn(value ? pathname : null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpenedOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex min-h-dvh">
      <Toaster />
      {open && (
        <div className="fixed inset-0 z-30 bg-deep-900/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <aside
        className={cn(
          "bg-deep fixed inset-y-0 left-0 z-40 flex w-64 print:hidden flex-col text-white transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <Link href="/" className="flex items-center gap-2.5 font-display font-bold">
            <Image src="/nrc-logo.jpeg" alt="" width={36} height={36} className="rounded-full" />
            NRC Education
          </Link>
          <button type="button" className="rounded-lg p-1.5 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <Icon name="close" className="size-5" />
          </button>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4" aria-label="Dashboard">
          {nav.map((group) => {
            const key = group.label || "main";
            const hasActive = group.items.some((item) => isActive(item.href, pathname));
            // A folded group opens by itself while one of its pages is showing.
            const expanded = !group.collapsible || (folded[key] ?? !hasActive) === false;
            return (
              <div key={key} className="mt-4 first:mt-0">
                {group.label &&
                  (group.collapsible ? (
                    <button
                      type="button"
                      onClick={() => setFolded({ ...folded, [key]: expanded })}
                      aria-expanded={expanded}
                      className="flex w-full items-center justify-between rounded-lg px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-white/50 hover:text-white/80"
                    >
                      {group.label}
                      <Icon name="chevron" className={cn("size-4 transition-transform", expanded && "rotate-90")} />
                    </button>
                  ) : (
                    <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-white/50">{group.label}</p>
                  ))}
                {expanded && (
                  <ul className="grid gap-0.5">
                    {group.items.map((item) => (
                      <NavLink key={item.href} item={item} active={isActive(item.href, pathname)} />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/15 px-5 py-4">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-white/60">{user.email}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-20 flex h-16 print:hidden items-center gap-3 rounded-none border-x-0 border-t-0 px-4 sm:px-6">
          <button type="button" className="rounded-lg p-2 text-brand-800 hover:bg-brand-600/10 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" className="size-5" />
          </button>
          <span className="rounded-full bg-brand-600/12 px-3 py-1 text-xs font-semibold text-brand-800">{user.roleLabel}</span>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/dashboard/notifications"
              className="relative rounded-lg p-2 text-brand-800 hover:bg-brand-600/10"
              aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} unread` : "Notifications"}
            >
              <Icon name="bell" className="size-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-accent-500 px-1 text-center text-[11px] font-bold leading-5 text-deep-900" aria-hidden="true">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </Link>
            <PageHelpButton role={user.role} />
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

function isActive(href: string, pathname: string) {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const inner = (
    <>
      <Icon name={item.icon} className="size-5 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.soon && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold">Soon</span>}
      {item.badge ? (
        <span className="rounded-full bg-accent-500 px-2 py-0.5 text-[11px] font-bold text-deep-900">
          {item.badge}<span className="sr-only"> unread</span>
        </span>
      ) : null}
    </>
  );
  const base = "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium";
  return (
    <li>
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
}
