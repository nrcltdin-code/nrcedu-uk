"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";

// Password input with a Show / Hide toggle.
export function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("pr-16", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 rounded-r-xl px-3.5 text-xs font-semibold text-brand-700 hover:text-brand-900"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

const levels = [
  { label: "Too short", bar: "bg-red-500" },
  { label: "Weak", bar: "bg-red-500" },
  { label: "Fair", bar: "bg-amber-500" },
  { label: "Good", bar: "bg-emerald-500" },
  { label: "Strong", bar: "bg-emerald-600" },
];

// A rough 0–4 score: length plus the mix of letter cases, digits and symbols.
export function passwordScore(password: string) {
  if (password.length < 8) return 0;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  let score = 1;
  if (password.length >= 12) score++;
  if (kinds >= 3) score++;
  if (password.length >= 16 || (kinds === 4 && password.length >= 10)) score++;
  return Math.min(score, 4);
}

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return <p className="mt-1.5 text-xs text-muted">At least 8 characters. Longer is stronger.</p>;
  const score = passwordScore(password);
  return (
    <div className="mt-2" aria-live="polite">
      <div className="grid grid-cols-4 gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className={cn("h-1.5 rounded-full", step <= Math.max(score, 1) ? levels[score].bar : "bg-brand-900/10")} />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted">Password strength: {levels[score].label}</p>
    </div>
  );
}
