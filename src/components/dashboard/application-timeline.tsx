import type { ApplicationStage, Prisma } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { eventText, stageLabel, stageTones } from "@/lib/application-flow";

// An application's history, newest first. Staff see every event (internal ones marked);
// students and agents get only events with visibleToStudent, so pass those in already filtered.

export const eventSelect = {
  id: true,
  type: true,
  fromStage: true,
  toStage: true,
  note: true,
  visibleToStudent: true,
  meta: true,
  createdAt: true,
  actor: { select: { name: true, role: true } },
} satisfies Prisma.ApplicationEventSelect;

type Event = Prisma.ApplicationEventGetPayload<{ select: typeof eventSelect }>;

const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });

const detailNames: Record<string, string> = { universityRef: "applicant ID", casNumber: "number", visaReference: "visa reference", depositAmount: "deposit" };

function detailChanges(meta: Prisma.JsonValue, confirmationName: string) {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  return Object.entries(meta as Record<string, { from: string | null; to: string | null }>)
    .map(([key, change]) => {
      const name = key === "casNumber" ? `${confirmationName} number` : (detailNames[key] ?? key);
      return `${name}: ${change.from ?? "—"} → ${change.to ?? "—"}`;
    })
    .join("; ");
}

export function ApplicationTimeline({ events, confirmationName, staffView }: { events: Event[]; confirmationName: string; staffView: boolean }) {
  if (events.length === 0) return <p className="text-sm text-muted">Nothing yet.</p>;
  const stage = (s: ApplicationStage) => <Badge tone={stageTones[s]}>{stageLabel(s, confirmationName)}</Badge>;

  return (
    <ol className="grid gap-4">
      {events.map((e) => (
        <li key={e.id} className="border-l-2 border-brand-600/25 pl-4">
          <p className="text-xs text-muted">
            {dateTime.format(e.createdAt)} · {staffView ? (e.actor ? `${e.actor.name}${e.actor.role === "STUDENT" ? " (student)" : e.actor.role === "AGENT" ? " (agent)" : ""}` : "System") : e.actor?.role === "STUDENT" ? "You" : "NRC"}
            {staffView && !e.visibleToStudent && <span className="ml-2 rounded-full bg-brand-900/8 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider">internal</span>}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            {e.type === "stage" && e.toStage ? (
              <>
                {e.fromStage && <>{stage(e.fromStage)}<span aria-hidden>→</span></>}
                {stage(e.toStage)}
              </>
            ) : e.type === "created" ? (
              <span className="font-semibold">{eventText.created}</span>
            ) : (
              <span className="font-semibold">{eventText[e.type] ?? e.type}</span>
            )}
          </div>
          {e.type === "details.updated" ? (
            <p className="mt-0.5 text-sm text-muted">{detailChanges(e.meta, confirmationName)}</p>
          ) : (
            e.note && <p className="mt-0.5 whitespace-pre-line text-sm">{e.note}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
