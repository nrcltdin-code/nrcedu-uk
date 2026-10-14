import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const paths = {
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
  document: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5 M9 13h6 M9 17h6",
  shield: "M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.500-8-9V6z M9 12l2 2 4-4",
  send: "M22 2L11 13 M22 2l-7 20-4-9-9-4z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.300-4.300",
  cap: "M2 9l10-5 10 5-10 5z M6 11.500V16c0 1.500 2.700 3 6 3s6-1.500 6-3v-4.500 M22 9v6",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M3 12h18 M12 3c2.500 2.700 3.800 5.700 3.800 9s-1.300 6.300-3.800 9c-2.500-2.700-3.800-5.700-3.800-9S9.500 5.700 12 3z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2",
  check: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M8.500 12.500l2.500 2.500 4.500-5",
  building: "M3 21h18 M5 21V10 M19 21V10 M9 21v-7 M15 21v-7 M12 3l9 5H3z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  mail: "M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z M3 7l9 6 9-6",
  users: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1 M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M21 19v-1a4 4 0 0 0-3-3.87 M15.5 3.13a3.5 3.5 0 0 1 0 6.74",
  pencil: "M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4",
  pin: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  home: "M3 11l9-7 9 7 M5 10v10h5v-6h4v6h5V10",
  image: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z M3 16l5-5 4 4 3-3 6 6 M15.5 9.5a1.5 1.5 0 1 0 0-.01",
  inbox: "M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z M3 13h5l1 3h6l1-3h5",
  briefcase: "M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2 M3 13h18",
  coins: "M9 10a6 3 0 1 0 0-.01 M3 10v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4 M15 8.5c3.3.2 6 1.400 6 3v4c0 1.700-2.700 3-6 3",
  settings: "M4 6h16 M4 12h16 M4 18h16 M8 4v4 M16 10v4 M10 16v4",
  menu: "M4 7h16 M4 12h16 M4 17h16",
  close: "M6 6l12 12 M18 6L6 18",
  arrowLeft:"M15 6l-6 6 6 6",
  arrowRight: "M9 6l6 6-6 6",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className, ...props }: { name: IconName } & ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("size-6", className)}
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}

const tileColors = {
  sky: "from-sky-400 to-brand-600 shadow-sky-500/40",
  amber: "from-accent-400 to-orange-500 shadow-orange-500/40",
  violet: "from-violet-400 to-indigo-600 shadow-indigo-500/40",
  emerald: "from-emerald-400 to-teal-600 shadow-teal-500/40",
} as const;

export type TileColor = keyof typeof tileColors;

// An icon on a bright gradient square.
export function IconTile({ name, color, className }: { name: IconName; color: TileColor; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-12 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-lg",
        tileColors[color],
        className,
      )}
    >
      <Icon name={name} />
    </span>
  );
}
