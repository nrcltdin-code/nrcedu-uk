import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { emailEnabled, link, sendEmail } from "@/lib/email";
import { dueLabel, londonToday } from "@/lib/reminders";
import { clearOldRateLimits } from "@/lib/rate-limit";

// Morning digest (plus a little housekeeping): each active staff member with reminders due today or overdue gets one email.
// Called daily by Vercel Cron (vercel.json), which sends "Authorization: Bearer <CRON_SECRET>".

function authorised(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!authorised(request)) return new Response("Not found.", { status: 404 });
  // Daily housekeeping that rides on this job: request counts older than a day are no longer needed.
  await clearOldRateLimits().catch((error) => console.error("Rate limit cleanup:", error));
  // Read notifications are kept for 90 days.
  await db.notification
    .deleteMany({ where: { readAt: { not: null }, createdAt: { lt: new Date(Date.now() - 90 * 86_400_000) } } })
    .catch((error) => console.error("Notification cleanup:", error));
  if (!emailEnabled) return Response.json({ sent: 0, reason: "email is off" });

  const due = await db.reminder.findMany({
    where: { doneAt: null, dueAt: { lte: londonToday() }, staff: { status: "ACTIVE", role: { in: ["ADMIN", "STAFF"] } } },
    orderBy: { dueAt: "asc" },
    select: { text: true, dueAt: true, staff: { select: { id: true, name: true, email: true } } },
  });

  const byStaff = new Map<string, { name: string; email: string; lines: string[] }>();
  for (const reminder of due) {
    const entry = byStaff.get(reminder.staff.id) ?? { name: reminder.staff.name, email: reminder.staff.email, lines: [] };
    entry.lines.push(`- ${reminder.text} (${dueLabel(reminder.dueAt).text.toLowerCase()})`);
    byStaff.set(reminder.staff.id, entry);
  }

  let sent = 0;
  for (const staff of byStaff.values()) {
    const count = staff.lines.length;
    const ok = await sendEmail({
      to: staff.email,
      subject: `${count} ${count === 1 ? "reminder" : "reminders"} due today`,
      text: `Good morning ${staff.name},\n\nYour follow-ups for today:\n\n${staff.lines.slice(0, 30).join("\n")}${count > 30 ? `\n…and ${count - 30} more` : ""}\n\nOpen your reminders: ${link("/dashboard/reminders")}`,
    });
    if (ok) sent++;
  }
  return Response.json({ sent });
}
