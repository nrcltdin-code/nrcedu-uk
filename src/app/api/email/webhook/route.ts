import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

// Resend delivery events (signed the Svix way). In Resend → Webhooks, point a webhook at
// https://<site>/api/email/webhook with the email.delivered, email.bounced and
// email.complained events, and put its signing secret in EMAIL_WEBHOOK_SECRET.

const statusFor: Record<string, "DELIVERED" | "BOUNCED" | "COMPLAINED"> = {
  "email.delivered": "DELIVERED",
  "email.bounced": "BOUNCED",
  "email.complained": "COMPLAINED",
};

function verified(secret: string, id: string, timestamp: string, signatures: string, body: string) {
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();
  return signatures.split(" ").some((part) => {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) return false;
    const given = Buffer.from(value, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

export async function POST(request: Request) {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  if (!secret) return new Response("Not set up", { status: 404 });

  const body = await request.text();
  const id = request.headers.get("svix-id") ?? "";
  const timestamp = request.headers.get("svix-timestamp") ?? "";
  const signatures = request.headers.get("svix-signature") ?? "";
  if (!id || !timestamp || !verified(secret, id, timestamp, signatures, body)) return new Response("Bad signature", { status: 401 });

  let event: { type?: string; data?: { email_id?: string; bounce?: { message?: string } } };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Bad body", { status: 400 });
  }
  const status = event.type ? statusFor[event.type] : undefined;
  const providerId = event.data?.email_id;
  if (status && providerId) {
    // A bounce or complaint is never overwritten by a late "delivered".
    await db.emailLog.updateMany({
      where: { providerId, ...(status === "DELIVERED" ? { status: { in: ["SENT"] } } : {}) },
      data: { status, ...(status === "BOUNCED" ? { error: event.data?.bounce?.message?.slice(0, 500) ?? "Bounced" } : {}) },
    });
  }
  return new Response("ok");
}
