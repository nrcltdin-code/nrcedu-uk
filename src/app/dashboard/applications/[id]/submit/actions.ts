"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { applicationMethodLabels, isApplicationMethod } from "@/lib/application-method";
import { stages } from "@/lib/application-flow";
import { applicationEvent, moveApplicationStage } from "@/lib/applications";
import { db } from "@/lib/db";
import { emailEnabled, sendEmail } from "@/lib/email";
import { text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { isEmail } from "@/lib/leads";
import { requirePermission } from "@/lib/session";
import { getPrivateObject, privateStorageEnabled } from "@/lib/storage";
import { buildSubmissionPack, submissionCode } from "@/lib/submission";

// Attachments above this go as a ZIP the counsellor uploads instead; Resend refuses
// messages over 40 MB once base64 adds its third.
const MAX_ATTACHMENT_BYTES = 28 * 1024 * 1024;

const beforeSubmitted = (stage: (typeof stages)[number]) => stages.indexOf(stage) < stages.indexOf("SUBMITTED_TO_UNIVERSITY");

// Email the application to the university with the chosen documents attached. Replies go to
// the counsellor who sent it, and the subject carries a code that ties replies back here.
export async function sendSubmissionEmail(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("APPLICATIONS", "edit");
  const id = text(form, "id");
  const to = text(form, "to");
  const subject = text(form, "subject");
  const message = text(form, "message");
  const chosen = new Set(form.getAll("doc").map(String));

  if (!emailEnabled) return { error: "Email is not set up on this site yet (EMAIL_API_KEY and EMAIL_FROM)." };
  if (!isEmail(to)) return { error: "Enter the university's email address." };
  if (subject.length < 3 || subject.length > 150) return { error: "Add a subject under 150 characters." };
  if (message.length > 20_000) return { error: "The message is too long." };

  const pack = await buildSubmissionPack(id);
  if (!pack) return { error: "This application no longer exists." };
  if (pack.blockers.length) return { error: `Fix these first: ${pack.blockers.join(" ")}` };

  const documents = pack.documents.filter((d) => chosen.has(d.id));
  if (documents.length && !privateStorageEnabled) return { error: "Document storage is not set up, so files cannot be attached." };
  const keys = await db.document.findMany({ where: { id: { in: documents.map((d) => d.id) } }, select: { id: true, fileKey: true } });
  const keyById = new Map(keys.map((k) => [k.id, k.fileKey]));

  let attachments: { filename: string; content: string }[];
  try {
    const files = await Promise.all(
      documents.map(async (d) => {
        const key = keyById.get(d.id);
        if (!key) throw new Error(`No file for ${d.id}`);
        return { filename: d.fileName, data: await getPrivateObject(key) };
      }),
    );
    const total = files.reduce((sum, f) => sum + f.data.length, 0);
    if (total > MAX_ATTACHMENT_BYTES) {
      return { error: `The documents add up to ${Math.round(total / 1024 / 1024)} MB, over the 28 MB email limit. Untick some, or download the ZIP and send it another way.` };
    }
    attachments = files.map((f) => ({ filename: f.filename, content: Buffer.from(f.data).toString("base64") }));
  } catch (error) {
    console.error("Submission attachments:", error);
    return { error: "The documents could not be fetched. Please try again." };
  }

  const code = submissionCode(id);
  const fullSubject = subject.includes(code) ? subject : `${subject} [${code}]`;
  const sent = await sendEmail({ to, cc: [user.email], replyTo: user.email, subject: fullSubject, text: message, attachments });
  if (!sent) return { error: "The email could not be sent. Nothing was recorded; please try again." };

  await applicationEvent({
    applicationId: id,
    actorId: user.id,
    type: "submission.emailed",
    note: `Sent to ${to} with ${documents.length} document${documents.length === 1 ? "" : "s"}.`,
    meta: { to, subject: fullSubject, documents: documents.map((d) => d.fileName) },
  });
  if (beforeSubmitted(pack.stage)) {
    const moved = await moveApplicationStage(user, { id, stage: "SUBMITTED_TO_UNIVERSITY", note: "Sent to the university by email.", meta: { method: "EMAIL" } });
    if (moved.error) return { error: `The email was sent, but the stage could not be changed: ${moved.error}` };
  }
  revalidatePath(`/dashboard/applications/${id}`);
  redirect(`/dashboard/applications/${id}?submitted=email`);
}

// For portals, UCAS and anything else done outside the site: record that it went in, how,
// and the university's reference, and move the application to Submitted.
export async function recordSubmission(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("APPLICATIONS", "edit");
  const id = text(form, "id");
  const method = text(form, "method");
  const reference = text(form, "universityRef");
  const note = text(form, "note");
  if (!isApplicationMethod(method)) return { error: "Choose how it was submitted." };
  if (reference.length > 80) return { error: "Keep the reference under 80 characters." };
  if (note.length > 900) return { error: "Keep the note under 900 characters." };

  const pack = await buildSubmissionPack(id);
  if (!pack) return { error: "This application no longer exists." };
  if (!beforeSubmitted(pack.stage)) return { error: "This application is already past submission." };

  const via = `Submitted via ${applicationMethodLabels[method]}.`;
  const moved = await moveApplicationStage(user, { id, stage: "SUBMITTED_TO_UNIVERSITY", note: note ? `${via} ${note}` : via, meta: { method } });
  if (moved.error) return moved;
  if (reference && reference !== pack.universityRef) {
    await db.$transaction([
      db.application.update({ where: { id }, data: { universityRef: reference } }),
      applicationEvent({ applicationId: id, actorId: user.id, type: "details.updated", meta: { universityRef: { from: pack.universityRef, to: reference } } }),
    ]);
  }
  revalidatePath(`/dashboard/applications/${id}`);
  redirect(`/dashboard/applications/${id}?submitted=recorded`);
}
