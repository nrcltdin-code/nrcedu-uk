"use server";

import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { alertKinds, isEmailAddress, sendingDomain } from "@/lib/email-settings";
import { text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { requirePermission } from "@/lib/session";

const list = (value: string) => value.split(/[\s,;]+/).map((a) => a.trim().toLowerCase()).filter(Boolean);

export async function saveEmailSettings(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("SETTINGS", "edit");
  const domain = sendingDomain();

  const fromName = text(form, "fromName");
  const fromAddress = text(form, "fromAddress").toLowerCase();
  const replyTo = text(form, "replyTo").toLowerCase();
  if (!fromName || fromName.length > 80 || /[<>"]/.test(fromName)) return { error: "Enter a sender name under 80 characters, without < > or quotes." };
  if (!isEmailAddress(fromAddress)) return { error: "Enter a valid sending address." };
  if (domain && !fromAddress.endsWith(`@${domain}`)) return { error: `The sending address must end with @${domain}, the domain set up with the mail service.` };
  if (replyTo && !isEmailAddress(replyTo)) return { error: "Enter a valid reply-to address, or leave it empty." };

  const alerts: Record<string, string[]> = {};
  for (const { key, label } of alertKinds) {
    const addresses = list(text(form, `alert-${key}`));
    const bad = addresses.find((a) => !isEmailAddress(a));
    if (bad) return { error: `${label}: "${bad}" is not a valid email address.` };
    if (addresses.length > 10) return { error: `${label}: 10 addresses at most.` };
    alerts[key] = [...new Set(addresses)];
  }

  // One line per country: "Bangladesh | bd@nrcedu-uk.com".
  const countries = await db.country.findMany({ select: { id: true, name: true } });
  const countryInboxes: { countryId: string; email: string }[] = [];
  const lines = text(form, "countryInboxes").split(/\r?\n/).map((line) => line.trim());
  for (const [index, line] of lines.entries()) {
    if (!line) continue;
    const [name, email, extra] = line.split("|").map((part) => part.trim());
    if (!name || !email || extra !== undefined) return { error: `Country inboxes, line ${index + 1}: write it as "Country | address".` };
    const country = countries.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (!country) return { error: `Country inboxes, line ${index + 1}: no country called "${name}". Add it under Countries first.` };
    if (!isEmailAddress(email.toLowerCase())) return { error: `Country inboxes, line ${index + 1}: "${email}" is not a valid email address.` };
    if (countryInboxes.some((row) => row.countryId === country.id)) return { error: `Country inboxes: ${country.name} is listed twice.` };
    countryInboxes.push({ countryId: country.id, email: email.toLowerCase() });
  }

  const value = { fromName, fromAddress, replyTo, alerts, countryInboxes };
  await db.$transaction([
    db.siteSetting.upsert({ where: { key: "email" }, create: { key: "email", value }, update: { value } }),
    db.activityLog.create({ data: { userId: user.id, action: "settings.update", entityType: "SiteSetting", entityId: "email" } }),
  ]);
  updateTag("email-settings");
  return { saved: true };
}

export async function resendEmail(id: string): Promise<FormState> {
  const user = await requirePermission("SETTINGS", "edit");
  const original = await db.emailLog.findUnique({ where: { id } });
  if (!original) return { error: "This email is no longer in the log." };
  if (original.text === null) return { error: "This email held a private link, so it cannot be resent. Ask the person to request a new one." };
  if (original.attachments) return { error: "Emails with attachments cannot be resent from here." };

  const split = (value: string | null) => (value ? value.split(",").map((a) => a.trim()).filter(Boolean) : []);
  const sent = await sendEmail({
    to: split(original.to),
    cc: split(original.cc),
    replyTo: original.replyTo ?? undefined,
    subject: original.subject,
    text: original.text,
    kind: original.kind ? `${original.kind} (resent)` : "Resent",
  });
  await db.activityLog.create({ data: { userId: user.id, action: "email.resend", entityType: "EmailLog", entityId: id } });
  revalidatePath("/dashboard/emails");
  return sent ? { saved: true } : { error: "The mail service did not accept it. Check the newest entry in the log for the reason." };
}
