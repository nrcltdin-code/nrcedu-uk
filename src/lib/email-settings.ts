import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

// Who sends the site's emails and which inbox gets each kind of staff alert. Saved from
// Dashboard → Email (SiteSetting key "email"); anything missing falls back to the
// EMAIL_FROM / EMAIL_STAFF_ALERTS environment variables.

export const alertKinds = [
  { key: "leads", label: "New leads", hint: "Consultation and contact forms, when the lead has no counsellor yet." },
  { key: "agents", label: "Agent applications", hint: "New agent sign-ups, profiles ready for review and agency upgrade requests." },
  { key: "messages", label: "Student messages", hint: "A student wrote in and has no active counsellor." },
] as const;
export type AlertKind = (typeof alertKinds)[number]["key"];

export type EmailSettings = {
  fromName: string;
  fromAddress: string;
  replyTo: string;
  alerts: Record<AlertKind, string[]>;
  // Extra inbox copied on every new lead from that country (e.g. Bangladesh → bd@).
  countryInboxes: { countryId: string; email: string }[];
};

export const isEmailAddress = (value: string) => /^[^\s@<>,]+@[^\s@<>,]+\.[^\s@<>,]+$/.test(value) && value.length <= 120;

// EMAIL_FROM may be "Name <a@b.com>" or a bare address.
function envFrom() {
  const raw = process.env.EMAIL_FROM?.trim() ?? "";
  const match = raw.match(/^(.*)<([^>]+)>$/);
  return match ? { name: match[1].trim().replace(/^"|"$/g, ""), address: match[2].trim() } : { name: "", address: raw };
}

// Only addresses on this domain can send: it is the one verified with the mail service.
export function sendingDomain() {
  return envFrom().address.split("@")[1]?.toLowerCase() ?? "";
}

function envAlerts() {
  return (process.env.EMAIL_STAFF_ALERTS ?? "").split(",").map((a) => a.trim()).filter(Boolean);
}

const addresses = (value: unknown) =>
  Array.isArray(value) ? value.filter((a): a is string => typeof a === "string" && isEmailAddress(a)).slice(0, 10) : [];
const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

function parse(value: unknown): EmailSettings {
  const saved = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const env = envFrom();
  const domain = sendingDomain();
  const fromAddress = str(saved.fromAddress).toLowerCase();
  const alerts = (saved.alerts ?? {}) as Record<string, unknown>;
  const fallback = envAlerts();
  return {
    fromName: str(saved.fromName).slice(0, 80) || env.name || "NRC Educational Consultant",
    fromAddress: isEmailAddress(fromAddress) && fromAddress.endsWith(`@${domain}`) ? fromAddress : env.address,
    replyTo: isEmailAddress(str(saved.replyTo)) ? str(saved.replyTo).toLowerCase() : "",
    alerts: Object.fromEntries(
      alertKinds.map(({ key }) => {
        const list = addresses(alerts[key]);
        return [key, list.length ? list : fallback];
      }),
    ) as Record<AlertKind, string[]>,
    countryInboxes: Array.isArray(saved.countryInboxes)
      ? saved.countryInboxes
          .map((row) => ({ countryId: str(row?.countryId), email: str(row?.email).toLowerCase() }))
          .filter((row) => row.countryId && isEmailAddress(row.email))
      : [],
  };
}

export async function getEmailSettings(): Promise<EmailSettings> {
  "use cache";
  cacheTag("email-settings");
  cacheLife("days");
  const row = await db.siteSetting.findUnique({ where: { key: "email" } });
  return parse(row?.value);
}

// Where a staff alert goes when nobody is assigned.
export async function alertAddresses(kind: AlertKind) {
  return (await getEmailSettings()).alerts[kind];
}

export async function countryInbox(countryId: string | null | undefined) {
  if (!countryId) return null;
  return (await getEmailSettings()).countryInboxes.find((row) => row.countryId === countryId)?.email ?? null;
}
