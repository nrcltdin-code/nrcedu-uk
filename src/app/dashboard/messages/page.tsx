import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getThread, markRead } from "@/lib/messages";
import { requirePermission, requireUser } from "@/lib/session";
import { requireMyStudentId } from "@/lib/student";
import { sendMyMessage } from "./actions";
import { MessageForm } from "./message-form";
import { Thread } from "./thread";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };

export default function MessagesPage({ searchParams }: PageProps<"/dashboard/messages">) {
  return (
    <Suspense fallback={<Card tone="solid">Loading messages…</Card>}>
      <Messages searchParams={searchParams} />
    </Suspense>
  );
}

async function Messages({ searchParams }: Pick<PageProps<"/dashboard/messages">, "searchParams">) {
  const user = await requireUser();
  return user.role === "STUDENT" ? <StudentThread /> : <Inbox searchParams={searchParams} />;
}

async function StudentThread() {
  const user = await requireUser();
  const studentId = await requireMyStudentId();
  const [messages, profile] = await Promise.all([
    getThread(studentId),
    db.studentProfile.findUnique({ where: { id: studentId }, select: { counsellor: { select: { name: true } } } }),
  ]);
  await markRead(studentId, user.id, "student");

  return (
    <>
      <PageHeader
        title="Messages"
        description={profile?.counsellor ? `Write to ${profile.counsellor.name}, your NRC counsellor.` : "Write to the NRC team; a counsellor will reply."}
      />
      <div className="grid max-w-3xl gap-6">
        <Thread messages={messages} isMine={(m) => m.senderId === user.id} empty="No messages yet. Ask us anything about your applications." />
        <Card tone="solid">
          <MessageForm key={messages.length} action={sendMyMessage} placeholder="Write your message…" />
          <p className="mt-3 text-xs text-muted">We email you when we reply.</p>
        </Card>
      </div>
    </>
  );
}

async function Inbox({ searchParams }: Pick<PageProps<"/dashboard/messages">, "searchParams">) {
  const user = await requirePermission("STUDENTS", "view");
  const { show } = await searchParams;
  const all = show === "all";

  const where: Prisma.MessageWhereInput = all ? {} : { student: { OR: [{ counsellorId: user.id }, { counsellorId: null }] } };
  const [threads, unread] = await Promise.all([
    db.message.groupBy({ by: ["studentId"], where, _max: { createdAt: true }, orderBy: { _max: { createdAt: "desc" } }, take: 100 }),
    db.message.groupBy({ by: ["studentId"], where: { ...where, readAt: null, sender: { role: "STUDENT" } }, _count: true }),
  ]);
  const students = await db.studentProfile.findMany({
    where: { id: { in: threads.map((t) => t.studentId) } },
    select: { id: true, user: { select: { name: true, email: true } }, counsellor: { select: { name: true } } },
  });
  const byId = new Map(students.map((s) => [s.id, s]));
  const unreadById = new Map(unread.map((u) => [u.studentId, u._count]));

  return (
    <>
      <PageHeader title="Messages" description="Conversations with students. To start one, open a student and choose Messages." />
      <Card tone="solid" className="max-w-3xl">
        <div className="flex gap-2 text-sm">
          <Link href="/dashboard/messages" aria-current={!all ? "page" : undefined} className={!all ? "font-semibold text-brand-800" : "text-brand-700 hover:underline"}>
            My students and unassigned
          </Link>
          <span className="text-muted">·</span>
          <Link href="/dashboard/messages?show=all" aria-current={all ? "page" : undefined} className={all ? "font-semibold text-brand-800" : "text-brand-700 hover:underline"}>
            All
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-brand-900/10">
          {threads.map((thread) => {
            const student = byId.get(thread.studentId);
            if (!student) return null;
            const count = unreadById.get(thread.studentId) ?? 0;
            return (
              <li key={thread.studentId}>
                <Link href={`/dashboard/messages/${thread.studentId}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-2 py-3 hover:bg-brand-600/5">
                  <span className="min-w-0">
                    <span className={count ? "block font-bold" : "block font-semibold"}>{student.user.name}</span>
                    <span className="block truncate text-sm text-muted">
                      {[student.user.email, student.counsellor?.name ?? "No counsellor", thread._max.createdAt && `last ${formatDate(thread._max.createdAt)}`].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  {count > 0 && <Badge tone="accent">{count} unread</Badge>}
                </Link>
              </li>
            );
          })}
          {threads.length === 0 && <li className="py-3 text-muted">No conversations yet.</li>}
        </ul>
      </Card>
    </>
  );
}
