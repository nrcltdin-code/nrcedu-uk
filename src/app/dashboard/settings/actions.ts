"use server";

import { updateTag } from "next/cache";
import { db } from "@/lib/db";
import { text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import type { NavItem } from "@/lib/nav";
import { facebookPageName, isSafeHref, socialNetworks } from "@/lib/settings";
import { requirePermission } from "@/lib/session";

async function store(key: string, value: object, userId: string) {
  await db.$transaction([
    db.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } }),
    db.activityLog.create({ data: { userId, action: "settings.update", entityType: "SiteSetting", entityId: key } }),
  ]);
  updateTag("settings");
}

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isPhone = (value: string) => /^\+?[\d\s()-]{6,25}$/.test(value);

export async function saveContact(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("SETTINGS", "edit");

  const value = {
    phone: text(form, "phone"),
    email: text(form, "email").toLowerCase(),
    whatsapp: text(form, "whatsapp"),
    messenger: text(form, "messenger"),
    address: text(form, "address"),
    reviewLink: text(form, "reviewLink"),
  };
  if (!isPhone(value.phone)) return { error: "Enter a phone number using digits, spaces and an optional +." };
  if (!isEmail(value.email) || value.email.length > 120) return { error: "Enter a valid email address." };
  if (value.whatsapp && !isPhone(value.whatsapp)) return { error: "Enter the WhatsApp number using digits, spaces and an optional +." };
  if (value.messenger && !facebookPageName(value.messenger)) return { error: "Enter the Facebook page name (e.g. nrcedu) or its m.me link." };
  if (value.address.length > 300) return { error: "Keep the address under 300 characters." };
  if (value.reviewLink && (!isSafeHref(value.reviewLink) || value.reviewLink.startsWith("/") || value.reviewLink.length > 300)) return { error: "The Google review link must be a full address starting with https://" };

  await store("contact", value, user.id);
  return { saved: true };
}

export async function saveSocial(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("SETTINGS", "edit");

  const value: Record<string, string> = {};
  for (const { key, label } of socialNetworks) {
    const url = text(form, key);
    if (url && (!isSafeHref(url) || url.startsWith("/") || url.length > 300)) {
      return { error: `${label} must be a full address starting with https://` };
    }
    value[key] = url;
  }

  await store("social", value, user.id);
  return { saved: true };
}

// One link per line as "Label | /path". In the footer, "## Title" starts a column.
function parseLine(line: string, number: number): NavItem | string {
  const [label, href, extra] = line.split("|").map((part) => part.trim());
  if (!label || !href || extra !== undefined) return `Line ${number}: write it as "Label | /path".`;
  if (label.length > 60) return `Line ${number}: keep the label under 60 characters.`;
  if (!isSafeHref(href) || href.length > 300) return `Line ${number}: the link must start with / or https://`;
  return { label, href };
}

export async function saveMenus(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("SETTINGS", "edit");

  const lines = (key: string) =>
    text(form, key)
      .split(/\r?\n/)
      .map((line, index) => ({ line: line.trim(), number: index + 1 }))
      .filter(({ line }) => line);

  const main: NavItem[] = [];
  for (const { line, number } of lines("main")) {
    const item = parseLine(line, number);
    if (typeof item === "string") return { error: `Main menu, ${item.charAt(0).toLowerCase()}${item.slice(1)}` };
    main.push(item);
  }
  if (main.length === 0) return { error: "The main menu needs at least one link." };
  if (main.length > 10) return { error: "Keep the main menu to 10 links or fewer so it fits." };

  const footer: { title: string; items: NavItem[] }[] = [];
  for (const { line, number } of lines("footer")) {
    if (line.startsWith("#")) {
      const title = line.replace(/^#+/, "").trim();
      if (!title || title.length > 60) return { error: `Footer, line ${number}: column titles should be 1 to 60 characters.` };
      footer.push({ title, items: [] });
      continue;
    }
    if (footer.length === 0) return { error: `Footer, line ${number}: start with a column title, like "## Company".` };
    const item = parseLine(line, number);
    if (typeof item === "string") return { error: `Footer, ${item.charAt(0).toLowerCase()}${item.slice(1)}` };
    footer.at(-1)!.items.push(item);
  }
  if (footer.length === 0 || footer.some((group) => group.items.length === 0)) {
    return { error: "Every footer column needs a title and at least one link." };
  }
  if (footer.length > 4) return { error: "The footer has room for 4 columns at most." };

  await store("menus", { main, footer }, user.id);
  return { saved: true };
}
