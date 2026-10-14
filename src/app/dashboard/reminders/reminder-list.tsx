import Link from "next/link";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dueLabel } from "@/lib/reminders";
import { deleteReminder, setReminderDone } from "./actions";

export type ReminderRow = {
  id: string;
  text: string;
  dueAt: Date;
  doneAt: Date | null;
  staff: { name: string };
  lead?: { id: string; name: string } | null;
  student?: { id: string; user: { name: string } } | null;
  application?: { id: string; student: { user: { name: string } }; course: { name: string } } | null;
};

function recordLink(row: ReminderRow) {
  if (row.lead) return { href: `/dashboard/leads/${row.lead.id}`, label: `Lead: ${row.lead.name}` };
  if (row.student) return { href: `/dashboard/students/${row.student.id}`, label: `Student: ${row.student.user.name}` };
  if (row.application) {
    return { href: `/dashboard/applications/${row.application.id}`, label: `Application: ${row.application.student.user.name}, ${row.application.course.name}` };
  }
  return null;
}

// showRecord: on the Reminders page each row links to its lead, student or application.
export function ReminderList({ rows, canChange, showRecord, showOwner, empty }: {
  rows: ReminderRow[];
  canChange: boolean;
  showRecord?: boolean;
  showOwner?: boolean;
  empty: string;
}) {
  return (
    <ul className="divide-y divide-brand-900/10">
      {rows.map((row) => {
        const due = dueLabel(row.dueAt);
        const record = showRecord ? recordLink(row) : null;
        return (
          <li key={row.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
            <div className="min-w-0">
              <p className={row.doneAt ? "text-muted line-through" : "font-medium"}>{row.text}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                {row.doneAt ? <Badge tone="success">Done</Badge> : <Badge tone={due.tone}>{due.text}</Badge>}
                {showOwner && <span>for {row.staff.name}</span>}
                {record && <Link href={record.href} className="text-brand-700 hover:underline">{record.label}</Link>}
              </p>
            </div>
            {canChange && (
              <div className="flex items-center gap-1">
                <form action={setReminderDone.bind(null, row.id, !row.doneAt)}>
                  <Button variant="glass" size="sm">{row.doneAt ? "Reopen" : "Done"}</Button>
                </form>
                <DeleteButton action={deleteReminder.bind(null, row.id)} question="Delete this reminder?" />
              </div>
            )}
          </li>
        );
      })}
      {rows.length === 0 && <li className="py-3 text-sm text-muted">{empty}</li>}
    </ul>
  );
}
