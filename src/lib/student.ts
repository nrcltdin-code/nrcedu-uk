import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

// The signed-in student's own profile id. People who registered on the website (or with
// Google) have no profile row until they first open the portal, so it is created here.
export async function requireMyStudentId(): Promise<string> {
  const user = await requireRole("STUDENT");
  const profile = await db.studentProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
    select: { id: true },
  });
  if (!profile) redirect("/dashboard");
  return profile.id;
}

export type NewStudent = {
  name: string;
  email: string;
  phone: string | null;
  countryId: string | null;
  counsellorId: string | null;
  agentId: string | null;
};

// Students are User accounts with role STUDENT. Staff-created ones have no password yet;
// the student sets one when they are invited to the portal (task 4.4).
export async function findOrCreateStudent(student: NewStudent): Promise<{ id: string } | { error: string }> {
  const email = student.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email }, include: { studentProfile: { select: { id: true } } } });

  if (existing) {
    if (existing.role !== "STUDENT") return { error: `${email} belongs to a staff or agent account, so it cannot be a student.` };
    if (existing.studentProfile) return existing.studentProfile;
    return db.studentProfile.create({
      data: { userId: existing.id, phone: student.phone, countryId: student.countryId, counsellorId: student.counsellorId, agentId: student.agentId },
      select: { id: true },
    });
  }

  const user = await db.user.create({
    data: {
      name: student.name,
      email,
      phone: student.phone,
      role: "STUDENT",
      studentProfile: {
        create: { phone: student.phone, countryId: student.countryId, counsellorId: student.counsellorId, agentId: student.agentId },
      },
    },
    select: { studentProfile: { select: { id: true } } },
  });
  return user.studentProfile!;
}

