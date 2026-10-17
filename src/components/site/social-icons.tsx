import { cn } from "@/lib/cn";
import type { SocialSettings } from "@/lib/settings";

// Simple single-colour glyphs (24×24, filled) for the social links set in Site settings.
const glyphs: Record<keyof SocialSettings, string> = {
  facebook: "M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v1.7H7.5v3.2h2.8V22H14v-10.3h2.8l.4-3.2z",
  instagram: "M12 7.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2zm0 7.6a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm5.9-7.8a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM12 3.6c2.7 0 3 0 4.1.1 2.7.1 4 1.4 4.1 4.1.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c-.1 2.7-1.4 4-4.1 4.1-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-2.7-.1-4-1.4-4.1-4.1-.1-1.1-.1-1.4-.1-4.1s0-3 .1-4.1c.1-2.7 1.4-4 4.1-4.1 1.1-.1 1.4-.1 4.1-.1zM12 2c-2.7 0-3.1 0-4.2.1C4.2 2.2 2.2 4.2 2.1 7.8 2 8.9 2 9.3 2 12s0 3.1.1 4.2c.1 3.6 2.1 5.6 5.7 5.7 1.1.1 1.5.1 4.2.1s3.1 0 4.2-.1c3.6-.1 5.6-2.1 5.7-5.7.1-1.1.1-1.5.1-4.2s0-3.1-.1-4.2c-.1-3.6-2.1-5.6-5.7-5.7C15.1 2 14.7 2 12 2z",
  linkedin: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4v12H3zm6.5 0h3.8v1.7h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6.1v6.2h-4v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.6h-4z",
  youtube: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z",
  tiktok: "M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-1.8-2.5V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6z",
  x: "M17.8 3h3.1l-6.8 7.7 8 10.3h-6.3l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.9zm-1.1 16.2h1.7L7.4 4.7H5.5z",
};

export function SocialIcons({ social, networks, className, tone = "light", size = "sm" }: {
  social: SocialSettings;
  networks: readonly { key: keyof SocialSettings; label: string }[];
  className?: string;
  tone?: "light" | "dark";
  // "md": larger outlined circles, as used in the home page hero.
  size?: "sm" | "md";
}) {
  const links = networks.filter(({ key }) => social[key]);
  if (!links.length) return null;
  return (
    <ul className={cn("flex items-center gap-1", className)} aria-label="Social media">
      {links.map(({ key, label }) => (
        <li key={key}>
          <a
            href={social[key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className={cn(
              "flex items-center justify-center rounded-full transition-colors",
              size === "sm" ? "size-7" : "size-9 border border-white/30 bg-white/5 hover:border-white/60",
              tone === "light" ? "text-ink/60 hover:bg-brand-600/10 hover:text-brand-700" : "text-white/75 hover:bg-white/10 hover:text-white",
            )}
          >
            <svg viewBox="0 0 24 24" className={size === "sm" ? "size-3.5" : "size-4"} fill="currentColor" aria-hidden="true"><path d={glyphs[key]} /></svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
