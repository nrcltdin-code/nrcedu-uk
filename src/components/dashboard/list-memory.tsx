"use client";

// Remembers a list page's filters (search, country, page) so the "back" link on a
// detail page returns to the same filtered list, even after saves and redirects.
import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export function RememberListUrl({ storageKey }: { storageKey: string }) {
  const params = useSearchParams();
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, params.toString());
    } catch {}
  }, [params, storageKey]);
  return null;
}

export function BackToList({ storageKey, href, label }: { storageKey: string; href: string; label: string }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={(event) => {
        let query: string | null = null;
        try {
          query = sessionStorage.getItem(storageKey);
        } catch {}
        if (!query) return;
        event.preventDefault();
        router.push(`${href}?${query}`);
      }}
      className="text-sm font-medium text-brand-700 hover:underline"
    >
      ← {label}
    </Link>
  );
}
