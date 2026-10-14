import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getThread, markRead } from "@/lib/messages";
import { can, requirePermission } from "@/lib/session";
import { sendStaffMessage } from "../actions";
import { MessageForm } from "../message-form";
import { Thread } from "../thread";

export const metadata: Metadata = { title: "Conversation", robots: { index: false } };

export default function ConversationPage({ params }: PageProps<"/dashboard/messages/[studentId]">) {
  return (
    <Suspense fallback={<Card tone="solid">Loading conversation…</Card>}>
      <Conversation params={params} />
    </Suspense>
  );
}

async function Conversation({ params }: Pick<PageProps<"/dashboard/messages/[studentId]">, "params">) {
  const user = await requirePermission("STUDENTS", "view");
  const { studentId } = await params;
  const student = await db.studentProfile.findUnique({
    where: { id: studentId },
    select: { userId: true, user: { select: { name: true } }, counsellor: { select: { name: true } }, agent: { select: { user: { select: { name: true } } } } },
  });
  if (!student) notFound();

  const [messages, canEdit] = await Promise.all([getThread(studentId), can(user, "STUDENTS", "edit")]);
  await markRead(studentId, student.userId, "staff");

  return (
    <>
      <PageHeader
        back={{ href: "/dashboard/messages", label: "Messages" }}
        title={student.user.name}
        description={
          <>
            Counsellor: {student.counsellor?.name ?? "none"}
            {student.agent && <> · Agent: {student.agent.user.name}</>} ·{" "}
            <Link href={`/dashboard/students/${studentId}`} className="text-brand-700 hover:underline">Open student record</Link>
          </>
        }
      />
      <div className="grid max-w-3xl gap-6">
        <Thread messages={messages} isMine={(m) => m.senderId !== student.userId} empty="No messages yet." />
        {canEdit && (
          <Card tone="solid">
            <MessageForm key={messages.length} action={sendStaffMessage} studentId={studentId} placeholder="Write to the student…" />
            <p className="mt-3 text-xs text-muted">The student sees your name and is emailed. Every NRC staff member with access can read this conversation.</p>
          </Card>
        )}
      </div>
    </>
  );
}
