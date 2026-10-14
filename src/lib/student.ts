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
