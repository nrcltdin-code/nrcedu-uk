"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Drawer } from "@/components/ui/drawer";
import type { Role } from "@/generated/prisma/client";
import { getPageHelp } from "@/lib/page-help";

// "About this page" in the dashboard top bar: opens a panel explaining the current screen.
export function PageHelpButton({ role }: { role: Role }) {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const help = getPageHelp(pathname, role);
  if (!help) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenOn(pathname)}
        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-brand-700 hover:bg-brand-600/10"
      >
        <span aria-hidden="true" className="grid size-5 place-items-center rounded-full border border-current text-xs font-bold">?</span>
        <span className="hidden sm:inline">About this page</span>
        <span className="sr-only sm:hidden">About this page</span>
      </button>
      <Drawer open={openOn === pathname} onClose={() => setOpenOn(null)} title={help.title} description={help.summary}>
        <ul className="grid list-disc gap-2.5 pl-5 text-sm leading-relaxed">
          {help.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </Drawer>
    </>
  );
}
