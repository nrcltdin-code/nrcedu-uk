import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { NavItem } from "@/lib/nav";
import { contact as defaultContact, footerNav as defaultFooter, mainNav as defaultMain } from "@/lib/nav";

// Site settings live in the SiteSetting key/value table. Anything missing or malformed
// falls back to the defaults in lib/nav.ts, so the site never breaks on a bad row.

export type ContactSettings = { phone: string; email: string; whatsapp: string; messenger: string; address: string; reviewLink: string };
export type SocialSettings = Record<(typeof socialNetworks)[number]["key"], string>;
export type MenuSettings = { main: NavItem[]; footer: { title: string; items: NavItem[] }[] };
export type WelcomeSettings = { enabled: boolean; title: string; message: string; buttonLabel: string; linkLabel: string; linkHref: string };
export type SiteSettings = { contact: ContactSettings; social: SocialSettings; menus: MenuSettings; welcome: WelcomeSettings };

export const socialNetworks = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "x", label: "X (Twitter)" },
] as const;

export const defaultSettings: SiteSettings = {
  contact: { phone: defaultContact.phone, email: defaultContact.email, whatsapp: "", messenger: "", address: "", reviewLink: "" },
  social: { facebook: "", instagram: "", linkedin: "", youtube: "", tiktok: "", x: "" },
  menus: { main: defaultMain, footer: defaultFooter },
  // Until it is saved from the dashboard, the popup shows the original maintenance notice.
  welcome: {
    enabled: true,
    title: "This website is under maintenance",
    message: "We are making some improvements, so some pages or features may not work as expected. Thank you for your patience.",
    buttonLabel: "Got it",
    linkLabel: "",
    linkHref: "",
  },
};

function parseWelcome(welcome: Record<string, unknown> | null): WelcomeSettings {
  if (!welcome) return defaultSettings.welcome;
  const linkHref = str(welcome.linkHref);
  const safeLink = linkHref && isSafeHref(linkHref) ? linkHref : "";
  return {
    enabled: welcome.enabled === true,
    title: str(welcome.title, 120),
    message: str(welcome.message, 1000),
    buttonLabel: str(welcome.buttonLabel, 40) || "Close",
    linkLabel: safeLink ? str(welcome.linkLabel, 40) : "",
    linkHref: safeLink,
  };
}

// Internal paths ("/about") or full https:// addresses only; no javascript: or other schemes.
export function isSafeHref(href: string) {
  if (/^\/(?!\/)/.test(href)) return true;
  try {
    return new URL(href).protocol === "https:";
  } catch {
    return false;
  }
}

const str = (value: unknown, max = 300) => (typeof value === "string" ? value.slice(0, max) : "");

const httpsOnly = (url: string) => (url && isSafeHref(url) && !url.startsWith("/") ? url : "");

const navItems = (value: unknown): NavItem[] =>
  Array.isArray(value)
    ? value
        .map((item) => ({ label: str(item?.label, 60), href: str(item?.href, 300) }))
        .filter((item) => item.label && isSafeHref(item.href))
    : [];

function parse(rows: { key: string; value: unknown }[]): SiteSettings {
  const get = (key: string) => {
    const value = rows.find((row) => row.key === key)?.value;
    return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  };

  const contact = get("contact");
  const social = get("social");
  const menus = get("menus");

  const main = navItems(menus?.main);
  const footer = Array.isArray(menus?.footer)
    ? menus.footer
        .map((group) => ({ title: str(group?.title, 60), items: navItems(group?.items) }))
        .filter((group) => group.title && group.items.length)
    : [];

  return {
    contact: contact
      ? { phone: str(contact.phone, 40), email: str(contact.email, 120), whatsapp: str(contact.whatsapp, 40), messenger: str(contact.messenger, 80), address: str(contact.address, 300), reviewLink: httpsOnly(str(contact.reviewLink)) }
      : defaultSettings.contact,
    social: Object.fromEntries(
      socialNetworks.map(({ key }) => {
        const url = str(social?.[key]);
        return [key, url && isSafeHref(url) && !url.startsWith("/") ? url : ""];
      }),
    ) as SocialSettings,
    menus: { main: main.length ? main : defaultMain, footer: footer.length ? footer : defaultFooter },
    welcome: parseWelcome(get("welcome")),
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag("settings");
  cacheLife("days");

  const rows = await db.siteSetting.findMany({ where: { key: { in: ["contact", "social", "menus", "welcome"] } } });
  return parse(rows);
}

// "tel:" link for a phone number as typed ("+44 20 3355 4453" → "tel:+442033554453").
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
// wa.me wants digits only.
export const whatsappHref = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

// Facebook page name from a saved value: "nrcedu", "m.me/nrcedu" or "facebook.com/nrcedu".
export function facebookPageName(value: string) {
  const match = value.trim().match(/^(?:https?:\/\/)?(?:www\.|m\.)?(?:m\.me|facebook\.com|fb\.com)\/([^/?#\s]+)/i);
  const name = match ? match[1] : value.trim();
  return /^[\w.-]{2,80}$/.test(name) && name !== "profile.php" ? name : "";
}

// Messenger chat link: the saved Messenger page, or else the Facebook page from the social links.
export function messengerHref({ contact, social }: SiteSettings) {
  const name = facebookPageName(contact.messenger) || facebookPageName(social.facebook) || facebookPageName(defaultContact.facebookPage);
  return name ? `https://m.me/${name}` : "";
}
