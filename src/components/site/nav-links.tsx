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

const linkClass = (active: boolean, vertical?: boolean) =>
  cn(
    "block whitespace-nowrap rounded-full font-medium transition-colors",
    vertical ? "px-4 py-3 text-base" : "px-3 py-2 text-sm",
    active ? "bg-brand-600/12 text-brand-800" : "text-ink/80 hover:bg-brand-600/8 hover:text-ink",
  );

const chevron = (
  <svg viewBox="0 0 24 24" className="size-3.5 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
);

export function NavList({ items, pathname, vertical, onNavigate }: NavListProps) {
  const isActive = (href: string) => pathname === href || Boolean(pathname?.startsWith(`${href}/`));
  return (
    <ul className={cn("flex", vertical ? "flex-col gap-1" : "items-center gap-0.5")}>
      {items.map((item) => {
        const active = isActive(item.href);
        if (item.children?.length && vertical) {
          return (
            <li key={`${item.label}${item.href}`}>
              {item.menuOnly ? (
                <span className={cn(linkClass(false, true), "text-ink/60")}>{item.label}</span>
              ) : (
                <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={linkClass(active && pathname === item.href, true)}>{item.label}</Link>
              )}
              <ul className="ml-4 border-l border-brand-900/10 pl-2">
                {item.children.map((child) => (
                  <li key={child.href}>
                    <Link href={child.href} onClick={onNavigate} aria-current={isActive(child.href) ? "page" : undefined} className={cn(linkClass(isActive(child.href), true), "py-2 text-sm")}>{child.label}</Link>
                  </li>
                ))}
              </ul>
            </li>
          );
        }
        if (item.children?.length) {
          // Opens on hover and on keyboard focus; the parent link still goes to the overview page.
          // Long lists (e.g. destinations) split into columns of about four, up to six columns.
          const columns = Math.min(6, Math.ceil(item.children.length / 4));
          return (
            // A multi-column menu is centred under the whole header bar (its glass background makes it
            // the positioning parent); a short one opens under its own link.
            <li key={`${item.label}${item.href}`} className={cn("group", columns === 1 && "relative")}>
              {item.menuOnly ? (
                <button type="button" aria-haspopup="true" className={cn(linkClass(active), "flex items-center gap-1")}>
                  {item.label}
                  {chevron}
                </button>
              ) : (
                <Link href={item.href} aria-current={active ? "page" : undefined} aria-haspopup="true" className={cn(linkClass(active), "flex items-center gap-1")}>
                  {item.label}
                  {chevron}
                </Link>
              )}
              {/* The menu waits 300ms before closing so a slow pointer can cross the gap under the header;
                  the invisible strip above it also bridges that gap. */}
              <div className={cn("invisible absolute top-full z-50 pt-2 opacity-0 transition-[opacity,visibility] delay-300 before:absolute before:inset-x-0 before:bottom-full before:h-8 group-focus-within:visible group-focus-within:delay-0 group-hover:delay-0 group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100", columns === 1 ? "left-0" : "left-1/2 -translate-x-1/2")}>
                <ul
                  className="max-h-[70vh] overflow-y-auto rounded-2xl border border-brand-900/10 bg-white p-2 shadow-xl shadow-brand-900/15"
                  style={{ columnCount: columns, columnGap: "0.25rem", width: `min(${columns * 12}rem, calc(100vw - 2rem))` }}
                >
                  {item.children.map((child) => (
                    <li key={child.href} className="break-inside-avoid">
                      <Link href={child.href} aria-current={isActive(child.href) ? "page" : undefined}
                        className={cn("block rounded-xl px-3 py-2 text-sm font-medium", isActive(child.href) ? "bg-brand-600/12 text-brand-800" : "text-ink/85 hover:bg-brand-600/8")}>
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        }
        return (
          <li key={`${item.label}${item.href}`}>
            <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={linkClass(active, vertical)}>
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
