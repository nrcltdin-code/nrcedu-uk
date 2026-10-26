/* eslint-disable @next/next/no-img-element -- photos may come from Google as well as our storage */
import { cn } from "@/lib/cn";

// A person's profile photo, or their first initial in a coloured circle when they have none.
export function Avatar({ name, image, className }: { name: string; image?: string | null; className?: string }) {
  const base = cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-full", className);
  if (image) return <img src={image} alt="" className={cn(base, "object-cover")} referrerPolicy="no-referrer" />;
  return (
    <span className={cn(base, "bg-gradient-to-br from-brand-500 to-violet-600 font-bold uppercase text-white")}>
      {name.charAt(0)}
    </span>
  );
}
