"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { addEducation, addTestScore, deleteEducation, deleteTestScore } from "@/app/dashboard/profile/actions";
import type { FormState } from "@/lib/form";

type Education = { id: string; level: string; institution: string; fieldOfStudy: string | null; result: string | null; yearCompleted: number | null };
type Score = { id: string; test: string; score: string; takenAt: string | null };

type Props = {
  studentId: string;
  education: Education[];
  scores: Score[];
  levels: { value: string; label: string }[];
  canEdit: boolean;
};

// Education history and test scores, shared by the student portal and the staff student page.
export function EducationAndScores({ studentId, education, scores, levels, canEdit }: Props) {
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
                <span className="text-muted">{[levelLabel(e.level), e.fieldOfStudy, e.result, e.yearCompleted].filter(Boolean).join(" · ")}</span>
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
                <span className="font-semibold">{s.test}</span> <span className="text-muted">· {s.score}{s.takenAt && ` · ${s.takenAt}`}</span>
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`e-result-${studentId}`}>Result</Label>
            <Input id={`e-result-${studentId}`} name="result" maxLength={60} placeholder="GPA 5.00" />
          </div>
          <div>
            <Label htmlFor={`e-year-${studentId}`}>Year</Label>
            <Input id={`e-year-${studentId}`} name="yearCompleted" type="number" min={1950} max={2100} />
          </div>
        </div>
        <div className="sm:col-span-2 grid gap-3">
          <FormMessage state={state} />
          <Button type="submit" size="sm" disabled={pending} className="justify-self-start">{pending ? "Adding…" : "Add"}</Button>
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
      <form action={action} className="mt-3 grid gap-3 sm:grid-cols-3">
        <input type="hidden" name="studentId" value={studentId} />
        <div>
          <Label htmlFor={`t-test-${studentId}`}>Test</Label>
          <Input id={`t-test-${studentId}`} name="test" maxLength={40} placeholder="IELTS Academic" required />
        </div>
        <div>
          <Label htmlFor={`t-score-${studentId}`}>Score</Label>
          <Input id={`t-score-${studentId}`} name="score" maxLength={60} placeholder="7.0 (no band below 6.5)" required />
        </div>
        <div>
          <Label htmlFor={`t-date-${studentId}`}>Date taken</Label>
          <Input id={`t-date-${studentId}`} name="takenAt" type="date" />
        </div>
        <div className="sm:col-span-3 grid gap-3">
          <FormMessage state={state} />
          <Button type="submit" size="sm" disabled={pending} className="justify-self-start">{pending ? "Adding…" : "Add"}</Button>
        </div>
      </form>
    </details>
  );
}
