import "server-only";
import { after } from "next/server";
import { db } from "@/lib/db";
import { getEmailSettings } from "@/lib/email-settings";

// Transactional email through Resend's HTTP API (no SDK needed). Switches on once
// EMAIL_API_KEY and EMAIL_FROM are set; until then each message is only logged, so every
// flow keeps working without email. Messages are plain text: nothing a visitor typed can
// turn into HTML or a disguised link. Every message is recorded in EmailLog
// (Dashboard → Email), and Resend's webhook updates its delivery status.

const apiKey = process.env.EMAIL_API_KEY;

export const emailEnabled = Boolean(apiKey && process.env.EMAIL_FROM?.trim());

// attachments: base64 content. Resend caps a message at 40 MB after encoding.
// private: the body holds a secret link (sign-in, password reset, invite), so it is not stored.
// kind: a short label shown in the email log.
export type Email = {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
  cc?: string[];
  attachments?: { filename: string; content: string }[];
  private?: boolean;
  kind?: string;
};

const appUrl = () => (process.env.APP_URL ?? "").replace(/\/+$/, "");
export const link = (path: string) => `${appUrl()}${path}`;

const signOff = "\n\n— NRC Educational Consultants\n" + appUrl();
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").slice(0, 150);

async function record(email: Email, to: string[], subject: string, status: "OFF" | "SENT" | "FAILED", extra: { providerId?: string; error?: string; replyTo?: string }) {
  try {
    await db.emailLog.create({
      data: {
        to: to.join(", "),
        cc: email.cc?.length ? email.cc.join(", ") : null,
        replyTo: extra.replyTo || null,
        subject,
        text: email.private ? null : email.text,
        kind: email.kind ?? null,
        attachments: email.attachments?.length ?? 0,
        status,
        error: extra.error?.slice(0, 500) ?? null,
        providerId: extra.providerId ?? null,
      },
    });
  } catch (error) {
    console.error("Email log failed", error);
  }
}

export async function sendEmail(email: Email): Promise<boolean> {
  let to = [...new Set((Array.isArray(email.to) ? email.to : [email.to]).filter(Boolean))];
  // No main recipient (e.g. no alert inbox set): the copy addresses become the recipients.
  if (!to.length && email.cc?.length) to = [...new Set(email.cc)];
  if (!to.length) return false;
  const subject = oneLine(email.subject);
  const settings = await getEmailSettings();
  const replyTo = email.replyTo || settings.replyTo || undefined;
  if (!emailEnabled) {
    console.info(`[email off] to ${to.join(", ")}: ${subject}`);
    await record(email, to, subject, "OFF", { replyTo });
    return false;
  }
  const from = `${settings.fromName.replace(/[<>"\r\n]/g, "")} <${settings.fromAddress}>`;
  const cc = email.cc?.filter((address) => !to.includes(address));
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text: email.text + signOff, reply_to: replyTo, cc: cc?.length ? cc : undefined, attachments: email.attachments }),
      signal: AbortSignal.timeout(email.attachments?.length ? 60_000 : 10_000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`Email "${subject}" failed: ${response.status} ${detail}`);
      await record(email, to, subject, "FAILED", { replyTo, error: `${response.status} ${detail}` });
      return false;
    }
    const body = (await response.json().catch(() => ({}))) as { id?: string };
    await record(email, to, subject, "SENT", { replyTo, providerId: body.id });
    return true;
  } catch (error) {
    console.error(`Email "${subject}" failed`, error);
    await record(email, to, subject, "FAILED", { replyTo, error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

// Sends after the response, so a slow or failing mail service never delays or breaks the page.
export function queueEmail(...emails: Email[]) {
  after(() => Promise.all(emails.map(sendEmail)));
}
