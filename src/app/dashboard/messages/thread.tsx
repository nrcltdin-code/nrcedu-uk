import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

type ThreadMessage = { id: string; body: string; createdAt: Date; senderId: string | null; sender: { name: string } | null };

// UK time, like every other time in the dashboard; labelled because students often live elsewhere.
const timeFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });

// Messages oldest first; the viewer's side ("mine") sits on the right.
export function Thread({ messages, isMine, empty }: { messages: ThreadMessage[]; isMine: (m: ThreadMessage) => boolean; empty: string }) {
  if (!messages.length) return <Card tone="solid" className="text-muted">{empty}</Card>;
  return (
    <ol className="grid gap-3">
      {messages.map((message) => {
        const mine = isMine(message);
        return (
          <li key={message.id} className={cn("max-w-[85%] rounded-2xl px-4 py-3", mine ? "justify-self-end bg-brand-600 text-white" : "glass justify-self-start")}>
            <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
            <p className={cn("mt-1.5 text-xs", mine ? "text-white/75" : "text-muted")}>
              {message.sender?.name ?? "Former user"} · {timeFormat.format(message.createdAt)} UK time
            </p>
          </li>
        );
      })}
    </ol>
  );
}
