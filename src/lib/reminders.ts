import "server-only";
import { db } from "@/lib/db";

// Follow-up reminders for staff. A reminder is due on a day (no time): it is stored as midnight
// UTC of that date, and "today" is the date in London, where NRC works.

export type ReminderLink = { leadId: string } | { studentId: string } | { applicationId: string };

export function londonToday() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
  return new Date(`${today}T00:00:00Z`);
}

export const dueDateFromInput = (value: string) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null);

// Open reminders due today or earlier: the number shown next to Reminders in the menu.
export function dueReminderCount(staffId: string) {
  return db.reminder.count({ where: { staffId, doneAt: null, dueAt: { lte: londonToday() } } });
}

const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export function dueLabel(dueAt: Date) {
  const days = Math.round((dueAt.getTime() - londonToday().getTime()) / 86_400_000);
  if (days < -1) return { text: `${-days} days overdue`, tone: "danger" as const };
  if (days === -1) return { text: "Due yesterday", tone: "danger" as const };
  if (days === 0) return { text: "Due today", tone: "accent" as const };
  if (days === 1) return { text: "Tomorrow", tone: "neutral" as const };
  return { text: dayFormat.format(dueAt), tone: "neutral" as const };
}
