import "server-only";
import { after } from "next/server";

// Transactional email through Resend's HTTP API (no SDK needed). Switches on once
// EMAIL_API_KEY and EMAIL_FROM are set; until then each message is only logged, so every
// flow keeps working without email. Messages are plain text: nothing a visitor typed can
// turn into HTML or a disguised link.

const apiKey = process.env.EMAIL_API_KEY;
const from = process.env.EMAIL_FROM;

export const emailEnabled = Boolean(apiKey && from);

export type Email = { to: string | string[]; subject: string; text: string; replyTo?: string };

const appUrl = () => (process.env.APP_URL ?? "").replace(/\/+$/, "");
export const link = (path: string) => `${appUrl()}${path}`;

// Where staff alerts go when nobody is assigned (new leads, agent applications).
export function staffAlertAddresses() {
  return (process.env.EMAIL_STAFF_ALERTS ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}

const signOff = "\n\n— NRC Educational Consultants\n" + appUrl();
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").slice(0, 150);

export async function sendEmail(email: Email): Promise<boolean> {
  const to = (Array.isArray(email.to) ? email.to : [email.to]).filter(Boolean);
  if (!to.length) return false;
  const subject = oneLine(email.subject);
  if (!emailEnabled) {
    console.info(`[email off] to ${to.join(", ")}: ${subject}`);
    return false;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text: email.text + signOff, reply_to: email.replyTo }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error(`Email "${subject}" failed: ${response.status} ${await response.text().catch(() => "")}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Email "${subject}" failed`, error);
    return false;
  }
}

// Sends after the response, so a slow or failing mail service never delays or breaks the page.
export function queueEmail(...emails: Email[]) {
  after(() => Promise.all(emails.map(sendEmail)));
}
