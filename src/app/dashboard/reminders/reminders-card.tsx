import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { londonToday } from "@/lib/reminders";
import type { ReminderLink } from "@/lib/reminders";
import type { CurrentUser } from "@/lib/session";
import { ReminderForm } from "./reminder-form";
import { ReminderList } from "./reminder-list";

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

// Follow-up reminders on a lead, student or application page: open ones first, then the last
// few done. canEdit is the page's edit permission for that record.
export async function RemindersCard({ link, user, canEdit }: { link: ReminderLink; user: CurrentUser; canEdit: boolean }) {
  const [open, done, staff] = await Promise.all([
    db.reminder.findMany({ where: { ...link, doneAt: null }, orderBy: { dueAt: "asc" }, include: { staff: { select: { name: true } } } }),
    db.reminder.findMany({ where: { ...link, doneAt: { not: null } }, orderBy: { doneAt: "desc" }, take: 3, include: { staff: { select: { name: true } } } }),
    canEdit
      ? db.user.findMany({ where: { role: { in: ["ADMIN", "STAFF"] }, status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, name: true } })
      : [],
  ]);
  const tomorrow = isoDay(new Date(londonToday().getTime() + 86_400_000));

  return (
    <Card tone="solid">
      <h2 className="text-xl font-bold">Reminders</h2>
      <ReminderList rows={[...open, ...done]} canChange={canEdit} showOwner empty="No reminders. Add one to follow up later." />
      {canEdit && (
        <div className="mt-4 border-t border-brand-900/10 pt-4">
          <ReminderForm key={open.length} field={link} staff={staff} me={user.id} tomorrow={tomorrow} />
        </div>
      )}
    </Card>
  );
}
