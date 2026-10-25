"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Input, Label, Select } from "@/components/ui/field";
import { addEducation, addTestScore, deleteEducation, deleteTestScore, setEnglishMedium } from "@/app/dashboard/profile/actions";
import { englishTests } from "@/lib/course-match";
import type { FormState } from "@/lib/form";

type Education = {
  id: string;
  level: string;
  institution: string;
  fieldOfStudy: string | null;
  result: string | null;
  grade: string | null;
  gradeOutOf: string | null;
  yearCompleted: number | null;
};
type Score = { id: string; test: string; score: string; overall: string | null; lowest: string | null; takenAt: string | null };

type Props = {
  studentId: string;
  education: Education[];
  scores: Score[];
  englishMedium: boolean;
  levels: { value: string; label: string }[];
  canEdit: boolean;
};

// Common grading scales; the course finder turns grade ÷ scale into a percentage.
const gradeScales = [
  { value: "100", label: "Percentage (out of 100)" },
  { value: "5", label: "GPA out of 5 (SSC/HSC)" },
  { value: "4", label: "CGPA out of 4" },
  { value: "10", label: "CGPA out of 10" },
];

const formatGrade = (e: Education) => {
  if (e.grade === null || e.gradeOutOf === null) return e.result;
  return Number(e.gradeOutOf) === 100 ? `${Number(e.grade)}%` : `${Number(e.grade)} / ${Number(e.gradeOutOf)}`;
};

// Education history and test scores, shared by the student portal and the staff and agent student pages.
export function EducationAndScores({ studentId, education, scores, englishMedium, levels, canEdit }: Props) {
  const levelLabel = (value: string) => levels.find((l) => l.value === value)?.label ?? value;

  return (
    <div className="grid gap-8">
      <section>
        <h3 className="font-display text-lg font-bold">Education</h3>
        <ul className="mt-2 divide-y divide-brand-900/10">
          {education.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 py-2.5">
              <span className="min-w-0 text-sm">
                <span className="block font-semibold">{e.institution}</span>
                <span className="text-muted">{[levelLabel(e.level), e.fieldOfStudy, formatGrade(e), e.yearCompleted].filter(Boolean).join(" · ")}</span>
              </span>
              {canEdit && (
                <form action={deleteEducation.bind(null, e.id)}>
                  <Button variant="ghost" size="sm" className="text-red-700 hover:bg-red-500/10">Remove</Button>
                </form>
              )}
            </li>
          ))}
          {education.length === 0 && <li className="py-2 text-sm text-muted">Nothing added yet.</li>}
        </ul>
        {canEdit && <EducationForm key={education.length} studentId={studentId} levels={levels} />}
      </section>

      <section>
        <h3 className="font-display text-lg font-bold">English and other test scores</h3>
        <ul className="mt-2 divide-y divide-brand-900/10">
          {scores.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-3 py-2.5">
              <span className="text-sm">
                <span className="font-semibold">{s.test}</span>{" "}
                <span className="text-muted">
                  · {s.overall !== null ? `${Number(s.overall)} overall${s.lowest !== null ? `, lowest ${Number(s.lowest)}` : ""}` : s.score}
                  {s.takenAt && ` · ${s.takenAt}`}
                </span>
              </span>
              {canEdit && (
                <form action={deleteTestScore.bind(null, s.id)}>
                  <Button variant="ghost" size="sm" className="text-red-700 hover:bg-red-500/10">Remove</Button>
                </form>
              )}
            </li>
          ))}
          {scores.length === 0 && <li className="py-2 text-sm text-muted">Nothing added yet.</li>}
        </ul>
        {canEdit && <ScoreForm key={scores.length} studentId={studentId} />}
        {canEdit ? (
          <form action={setEnglishMedium.bind(null, studentId, !englishMedium)} className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span>{englishMedium ? "Studied in English: a medium-of-instruction (MOI) letter is available." : "Did the last qualification teach in English?"}</span>
            <Button type="submit" size="sm" variant="ghost">{englishMedium ? "Undo" : "Yes, studied in English"}</Button>
          </form>
        ) : (
          englishMedium && <p className="mt-4 text-sm">Studied in English (MOI letter available).</p>
        )}
      </section>
    </div>
  );
}

function EducationForm({ studentId, levels }: { studentId: string; levels: Props["levels"] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addEducation, {});
  return (
    <details className="mt-3" open={Boolean(state.error)}>
      <summary className="cursor-pointer text-sm font-semibold text-brand-700">Add education</summary>
      <form action={action} className="mt-3 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="studentId" value={studentId} />
        <div>
          <Label htmlFor={`e-level-${studentId}`}>Level</Label>
          <Select id={`e-level-${studentId}`} name="level" defaultValue="" required>
            <option value="" disabled>Choose…</option>
            {levels.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor={`e-inst-${studentId}`}>School, college or university</Label>
          <Input id={`e-inst-${studentId}`} name="institution" maxLength={150} required />
        </div>
        <div>
          <Label htmlFor={`e-field-${studentId}`}>Subject or group</Label>
          <Input id={`e-field-${studentId}`} name="fieldOfStudy" maxLength={100} placeholder="e.g. Science, BBA" />
        </div>
        <div>
          <Label htmlFor={`e-year-${studentId}`}>Year completed</Label>
          <Input id={`e-year-${studentId}`} name="yearCompleted" type="number" min={1950} max={2100} />
        </div>
        <div>
          <Label htmlFor={`e-grade-${studentId}`}>Result</Label>
          <Input id={`e-grade-${studentId}`} name="grade" type="number" min={0} step="0.01" placeholder="e.g. 4.50 or 72" />
        </div>
        <div>
          <Label htmlFor={`e-scale-${studentId}`}>Graded as</Label>
          <Select id={`e-scale-${studentId}`} name="gradeOutOf" defaultValue="100">
            {gradeScales.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
        <div className="sm:col-span-2 grid gap-3">
          <FormMessage state={state} />
          <SaveButton size="sm" disabled={pending} className="justify-self-start">{pending ? "Adding…" : "Add"}</SaveButton>
        </div>
      </form>
    </details>
  );
}

function ScoreForm({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addTestScore, {});
  return (
    <details className="mt-3" open={Boolean(state.error)}>
      <summary className="cursor-pointer text-sm font-semibold text-brand-700">Add a test score</summary>
      <form action={action} className="mt-3 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="studentId" value={studentId} />
        <div>
          <Label htmlFor={`t-test-${studentId}`}>Test</Label>
          <Select id={`t-test-${studentId}`} name="test" defaultValue="" required>
            <option value="" disabled>Choose…</option>
            {englishTests.map((t) => <option key={t} value={t}>{t}</option>)}
            <option value="Other">Other</option>
          </Select>
        </div>
        <div>
          <Label htmlFor={`t-date-${studentId}`}>Date taken</Label>
          <Input id={`t-date-${studentId}`} name="takenAt" type="date" />
        </div>
        <div>
          <Label htmlFor={`t-overall-${studentId}`}>Overall score</Label>
          <Input id={`t-overall-${studentId}`} name="overall" type="number" min={0} step="0.5" placeholder="e.g. 6.5, 58, 90" />
        </div>
        <div>
          <Label htmlFor={`t-lowest-${studentId}`}>Lowest section score</Label>
          <Input id={`t-lowest-${studentId}`} name="lowest" type="number" min={0} step="0.5" placeholder="Optional" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`t-score-${studentId}`}>Notes</Label>
          <Input id={`t-score-${studentId}`} name="score" maxLength={60} placeholder="Optional, e.g. L 7.0 R 6.5 W 6.0 S 6.5" />
        </div>
        <div className="sm:col-span-2 grid gap-3">
          <FormMessage state={state} />
          <SaveButton size="sm" disabled={pending} className="justify-self-start">{pending ? "Adding…" : "Add"}</SaveButton>
        </div>
      </form>
    </details>
  );
}
