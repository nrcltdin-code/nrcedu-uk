"use server";

import { redirect } from "next/navigation";
import { startApplication } from "@/lib/applications";
import { db } from "@/lib/db";
import { text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { requireUser } from "@/lib/session";
import { requireMyStudentId } from "@/lib/student";

export async function applyForCourse(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const studentId = await requireMyStudentId();
  const courseId = text(form, "courseId");

  // Students can only apply to courses shown on the website.
  const published = await db.course.count({ where: { id: courseId, isPublished: true, university: { isPublished: true } } });
  if (!published) return { error: "This course is not open for applications." };

  const result = await startApplication({ studentId, courseId, intakeId: text(form, "intakeId") || null, byUserId: user.id });
  if ("error" in result) return { error: result.error };
  redirect(`/dashboard/my-applications?started=${result.id}`);
}
