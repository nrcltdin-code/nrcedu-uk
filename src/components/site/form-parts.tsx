import type { ReactNode } from "react";
import { IconTile } from "@/components/ui/icon";

// Shared pieces for the public forms (contact, consultation, become an agent).

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-800">
      {children}
    </p>
  );
}

export function FormSuccess({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center py-10 text-center">
      <IconTile name="check" color="emerald" />
      <h2 className="mt-5 text-2xl font-bold">{title}</h2>
      <p className="mt-2 max-w-sm text-muted">{children}</p>
    </div>
  );
}

// Spam trap: hidden from people and left empty by real visitors. The server action treats
// a filled "website" field as spam.
export function SpamTrap() {
  return (
    <div aria-hidden="true" className="hidden">
      <label>
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
