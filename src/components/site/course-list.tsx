import Link from "next/link";
import { ApplyButton } from "@/components/site/apply-button";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { levelNames } from "@/lib/data/catalogue";
import { formatDuration, formatMoney } from "@/lib/format";
import type { StudyLevel } from "@/generated/prisma/client";

export type CourseRow = {
  id: string;
  name: string;
  level: StudyLevel;
  durationMonths: number | null;
  tuitionFee: number | null;
  currency: string;
  href: string;
  // Shown under the course name: the subject on a university page, the university on a subject page.
  detail?: string;
};

export function CourseList({ courses }: { courses: CourseRow[] }) {
  return (
    <ul className="grid gap-4">
      {courses.map((course) => (
        <li key={course.id}>
          <Card tone="solid" className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-bold">
                  <Link href={course.href} className="hover:text-brand-700">
                    {course.name}
                  </Link>
                </h3>
                <Badge>{levelNames[course.level]}</Badge>
              </div>
              <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                {course.detail && <span>{course.detail}</span>}
                {course.durationMonths && <span>{formatDuration(course.durationMonths)}</span>}
                {course.tuitionFee !== null && (
                  <span>
                    <span className="font-semibold text-ink">{formatMoney(course.tuitionFee, course.currency)}</span> per year
                  </span>
                )}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href={course.href} className={buttonStyles({ variant: "glass", size: "sm" })}>
                Details
              </Link>
              <ApplyButton courseId={course.id} />
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
