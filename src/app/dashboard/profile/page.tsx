import type { Metadata } from "next";
import { Suspense } from "react";
import { EducationAndScores } from "@/components/dashboard/education-scores";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireMyStudentId } from "@/lib/student";
import { studyLevelLabels } from "../leads/labels";
import { MyDetailsForm } from "./details-form";

export const metadata: Metadata = { title: "My profile", robots: { index: false } };

const isoDate = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : "");

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="My profile" description="Universities need these details for your application. Your counsellor can see everything here." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <Profile />
      </Suspense>
    </>
  );
}

async function Profile() {
  const studentId = await requireMyStudentId();
  const [student, countries] = await Promise.all([
    db.studentProfile.findUniqueOrThrow({
      where: { id: studentId },
      include: {
        user: { select: { name: true, email: true } },
        educationRecords: { orderBy: { yearCompleted: "desc" } },
        testScores: { orderBy: { takenAt: "desc" } },
      },
    }),
    db.country.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <Card tone="solid">
        <h2 className="mb-4 text-xl font-bold">Personal details</h2>
        <MyDetailsForm
          countries={countries}
          details={{
            name: student.user.name,
            email: student.user.email,
            phone: student.phone,
            countryId: student.countryId,
            dateOfBirth: isoDate(student.dateOfBirth),
            gender: student.gender,
            nationality: student.nationality,
            passportNumber: student.passportNumber,
            passportExpiry: isoDate(student.passportExpiry),
            address: student.address,
          }}
        />
      </Card>
      <Card tone="solid">
        <h2 className="mb-4 text-xl font-bold">Education and test scores</h2>
        <EducationAndScores
          studentId={student.id}
          canEdit
          levels={Object.entries(studyLevelLabels).map(([value, label]) => ({ value, label }))}
          education={student.educationRecords}
          scores={student.testScores.map((s) => ({ id: s.id, test: s.test, score: s.score, takenAt: s.takenAt ? isoDate(s.takenAt) : null }))}
        />
      </Card>
    </div>
  );
}
