"use client";

import { Suspense, useState } from "react";
import type { ReactNode } from "react";
import { ActiveNavList, NavList } from "@/components/site/nav-links";
import { Drawer } from "@/components/ui/drawer";
import type { NavItem } from "@/lib/nav";

// Phone and tablet navigation, shown in the same slide-in panel as sign in.
export function MobileMenu({ items, actions }: { items: NavItem[]; actions: ReactNode }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex size-10 items-center justify-center rounded-full text-brand-800 transition-colors hover:bg-brand-600/10 lg:hidden"
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <Drawer open={open} onClose={close} title="Menu">
        <nav aria-label="Main">
          <Suspense fallback={<NavList items={items} vertical onNavigate={close} />}>
            <ActiveNavList items={items} vertical onNavigate={close} />
          </Suspense>
        </nav>
        {/* Any button or link in here closes the menu first, so panels never stack. */}
        <div onClick={close} className="mt-auto flex flex-col gap-3 pt-8">
          {actions}
        </div>
      </Drawer>
    </>
  );
}
