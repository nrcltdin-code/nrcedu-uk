"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { NavItem } from "@/lib/nav";

type NavListProps = {
  items: NavItem[];
  pathname?: string;
  vertical?: boolean;
  onNavigate?: () => void;
};

export function NavList({ items, pathname, vertical, onNavigate }: NavListProps) {
  return (
    <ul className={cn("flex", vertical ? "flex-col gap-1" : "items-center gap-1")}>
      {items.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <li key={`${item.label}${item.href}`}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "block rounded-full font-medium transition-colors",
                vertical ? "px-4 py-3 text-base" : "px-3 py-2 text-sm",
                active ? "bg-brand-600/12 text-brand-800" : "text-ink/80 hover:bg-brand-600/8 hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// Same list with the current page highlighted. Wrap in <Suspense fallback={<NavList />}>,
// because the current path is not known while a page is being prerendered.
export function ActiveNavList(props: Omit<NavListProps, "pathname">) {
  return <NavList {...props} pathname={usePathname()} />;
}
