"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Checkbox, FormMessage } from "@/components/dashboard/form-bits";
import { ImageField } from "@/components/dashboard/image-field";
import { Button, buttonStyles } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { KeepValuesOnError } from "@/components/ui/keep-values-on-error";
import type { FormState } from "@/lib/form";
import { addIntake, addRequirement, saveCourse, saveProcess, saveUniversity } from "./actions";

type Option = { id: string; name: string };

// Entry requirements as strings (Decimals cannot reach the browser). Used by the course finder.
export type EntryValues = {
  requiredLevel?: string | null;
  minGradePercent: string | null;
  minIelts: string | null;
  minIeltsBand: string | null;
  maxStudyGapYears: number | null;
  acceptsMoi: boolean | null;
};

const moiValue = (value: boolean | null | undefined) => (value === true ? "yes" : value === false ? "no" : "");

function EntryRequirementFields({ prefix, values, levels, inherit }: {
  prefix: string;
  values: EntryValues | null;
  levels?: { value: string; label: string }[];
  inherit: string;
}) {
  return (
    <fieldset className="rounded-2xl border border-brand-900/10 p-4">
      <legend className="px-1 text-sm font-semibold">Entry requirements for the course finder</legend>
      <p className="mb-3 text-xs text-muted">Leave a box empty to use {inherit}.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {levels && (
          <div>
            <Label htmlFor={`${prefix}-req-level`}>Previous qualification needed</Label>
            <Select id={`${prefix}-req-level`} name="requiredLevel" defaultValue={values?.requiredLevel ?? ""}>
              <option value="">Default for the level</option>
              {levels.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor={`${prefix}-req-grade`}>Minimum grade (%)</Label>
          <Input id={`${prefix}-req-grade`} name="minGradePercent" type="number" min={0} max={100} step="0.5" defaultValue={values?.minGradePercent ?? ""} placeholder="e.g. 60" />
        </div>
        <div>
          <Label htmlFor={`${prefix}-req-ielts`}>IELTS overall</Label>
          <Input id={`${prefix}-req-ielts`} name="minIelts" type="number" min={0} max={9} step="0.5" defaultValue={values?.minIelts ?? ""} placeholder="e.g. 6.5" />
        </div>
        <div>
          <Label htmlFor={`${prefix}-req-band`}>No IELTS band below</Label>
          <Input id={`${prefix}-req-band`} name="minIeltsBand" type="number" min={0} max={9} step="0.5" defaultValue={values?.minIeltsBand ?? ""} placeholder="e.g. 6.0" />
        </div>
        <div>
          <Label htmlFor={`${prefix}-req-gap`}>Longest study gap (years)</Label>
          <Input id={`${prefix}-req-gap`} name="maxStudyGapYears" type="number" min={0} max={50} defaultValue={values?.maxStudyGapYears ?? ""} />
        </div>
        <div>
          <Label htmlFor={`${prefix}-req-moi`}>Accepts MOI letter instead of a test</Label>
          <Select id={`${prefix}-req-moi`} name="acceptsMoi" defaultValue={moiValue(values?.acceptsMoi)}>
            <option value="">Default</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </Select>
        </div>
      </div>
    </fieldset>
  );
}

// Decimals arrive as strings: Prisma's Decimal cannot be passed to the browser.
export type UniversityValues = {
  id: string;
  name: string;
  slug: string;
  countryId: string;
  city: string | null;
  website: string | null;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  ranking: number | null;
  nrcCommissionRate: string | null;
  agentCommissionRate: string | null;
  isOfficialPartner: boolean;
  isFeatured: boolean;
  isPublished: boolean;
} & EntryValues;

export function UniversityForm({ university, countries }: { university: UniversityValues | null; countries: Option[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveUniversity, {});

  return (
    <form action={action} className="grid gap-4">
      {university && <input type="hidden" name="id" value={university.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="uni-name">Name</Label>
          <Input id="uni-name" name="name" defaultValue={university?.name} maxLength={150} required />
        </div>
        <div>
          <Label htmlFor="uni-slug">Web address</Label>
          <Input id="uni-slug" name="slug" defaultValue={university?.slug} placeholder="Made from the name if left empty" />
        </div>
        <div>
          <Label htmlFor="uni-country">Country</Label>
          <Select id="uni-country" name="countryId" defaultValue={university?.countryId ?? ""} required>
            <option value="" disabled>Choose…</option>
            {countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="uni-city">City</Label>
          <Input id="uni-city" name="city" defaultValue={university?.city ?? ""} maxLength={100} />
        </div>
        <div>
          <Label htmlFor="uni-website">Website</Label>
          <Input id="uni-website" name="website" type="url" defaultValue={university?.website ?? ""} placeholder="https://…" />
        </div>
        <div>
          <Label htmlFor="uni-ranking">World ranking</Label>
          <Input id="uni-ranking" name="ranking" type="number" min={1} defaultValue={university?.ranking ?? ""} />
        </div>
      </div>
      <div>
        <Label htmlFor="uni-description">Description</Label>
        <Textarea id="uni-description" name="description" defaultValue={university?.description ?? ""} maxLength={10000} className="min-h-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageField name="logoUrl" label="Logo" defaultValue={university?.logoUrl} fit="contain" />
        <ImageField name="coverUrl" label="Cover image" defaultValue={university?.coverUrl} />
      </div>

      <fieldset className="rounded-2xl border border-brand-900/10 p-4">
        <legend className="px-1 text-sm font-semibold">Commission (staff only, never shown on the website)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="uni-nrc-rate">University pays NRC (%)</Label>
            <Input id="uni-nrc-rate" name="nrcCommissionRate" type="number" min={0} max={100} step="0.01" defaultValue={university?.nrcCommissionRate ?? ""} />
          </div>
          <div>
            <Label htmlFor="uni-agent-rate">NRC pays sub-agent (%)</Label>
            <Input id="uni-agent-rate" name="agentCommissionRate" type="number" min={0} max={100} step="0.01" defaultValue={university?.agentCommissionRate ?? ""} />
          </div>
        </div>
      </fieldset>

      <EntryRequirementFields prefix="uni" values={university} inherit="the usual default for each course level" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Checkbox name="isPublished" defaultChecked={university?.isPublished ?? true}>Show on the website</Checkbox>
        <Checkbox name="isFeatured" defaultChecked={university?.isFeatured}>Feature on the home page</Checkbox>
        <Checkbox name="isOfficialPartner" defaultChecked={university?.isOfficialPartner}>NRC is official representative</Checkbox>
      </div>

      <FormMessage state={state} />
      <SaveButton disabled={pending} className="justify-self-start">
        {pending ? "Saving…" : university ? "Save changes" : "Add university"}
      </SaveButton>
    </form>
  );
}

export type CourseValues = {
  id: string;
  name: string;
  slug: string;
  subjectId: string | null;
  level: string;
  durationMonths: number | null;
  tuitionFee: string | null;
  currency: string;
  description: string | null;
  entryRequirements: string | null;
  isPublished: boolean;
} & EntryValues;

type CourseFormProps = {
  universityId: string;
  course: CourseValues | null;
  subjects: Option[];
  levels: { value: string; label: string }[];
  qualificationLevels: { value: string; label: string }[];
};

export function CourseForm({ universityId, course, subjects, levels, qualificationLevels }: CourseFormProps) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCourse, {});

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="universityId" value={universityId} />
      {course && <input type="hidden" name="id" value={course.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="course-name">Course name</Label>
          <Input id="course-name" name="name" defaultValue={course?.name} maxLength={200} required />
        </div>
        <div>
          <Label htmlFor="course-slug">Web address</Label>
          <Input id="course-slug" name="slug" defaultValue={course?.slug} placeholder="Made from the name if left empty" />
        </div>
        <div>
          <Label htmlFor="course-level">Level</Label>
          <Select id="course-level" name="level" defaultValue={course?.level ?? ""} required>
            <option value="" disabled>Choose…</option>
            {levels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="course-subject">Subject</Label>
          <Select id="course-subject" name="subjectId" defaultValue={course?.subjectId ?? ""}>
            <option value="">None</option>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="course-duration">Duration (months)</Label>
          <Input id="course-duration" name="durationMonths" type="number" min={1} max={120} defaultValue={course?.durationMonths ?? ""} />
        </div>
        <div className="grid grid-cols-[1fr_6rem] gap-2">
          <div>
            <Label htmlFor="course-fee">Tuition fee per year</Label>
            <Input id="course-fee" name="tuitionFee" type="number" min={0} step="0.01" defaultValue={course?.tuitionFee ?? ""} />
          </div>
          <div>
            <Label htmlFor="course-currency">Currency</Label>
            <Input id="course-currency" name="currency" defaultValue={course?.currency ?? "GBP"} maxLength={3} />
          </div>
        </div>
      </div>
      <div>
        <Label htmlFor="course-description">Description</Label>
        <Textarea id="course-description" name="description" defaultValue={course?.description ?? ""} maxLength={10000} />
      </div>
      <div>
        <Label htmlFor="course-entry">Entry requirements</Label>
        <Textarea id="course-entry" name="entryRequirements" defaultValue={course?.entryRequirements ?? ""} maxLength={5000} />
      </div>
      <EntryRequirementFields prefix="course" values={course} levels={qualificationLevels} inherit="the university's default" />
      <Checkbox name="isPublished" defaultChecked={course?.isPublished ?? true}>Show on the website</Checkbox>
      <FormMessage state={state} />
      <div className="flex gap-3">
        <SaveButton disabled={pending}>{pending ? "Saving…" : course ? "Save course" : "Add course"}</SaveButton>
        <Link href={`/dashboard/universities/${universityId}#courses`} className={buttonStyles({ variant: "ghost" })}>Cancel</Link>
      </div>
    </form>
  );
}

export function IntakeForm({ universityId, courses }: { universityId: string; courses: Option[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addIntake, {});

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="universityId" value={universityId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="intake-name">Name</Label>
          <Input id="intake-name" name="name" placeholder="September 2027" maxLength={60} required />
        </div>
        <div>
          <Label htmlFor="intake-course">Course</Label>
          <Select id="intake-course" name="courseId" defaultValue="">
            <option value="">All courses</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="intake-start">Starts</Label>
          <Input id="intake-start" name="startDate" type="date" required />
        </div>
        <div>
          <Label htmlFor="intake-deadline">Application deadline</Label>
          <Input id="intake-deadline" name="applicationDeadline" type="date" />
        </div>
      </div>
      <FormMessage state={state} />
      <SaveButton disabled={pending} className="justify-self-start">{pending ? "Adding…" : "Add intake"}</SaveButton>
    </form>
  );
}

export function ProcessForm({ universityId, confirmationName, processNotes, method, methods, skipped, stages }: {
  universityId: string;
  confirmationName: string;
  processNotes: string | null;
  method: { value: string | null; url: string | null; email: string | null };
  methods: { value: string; label: string }[];
  skipped: string[];
  stages: { value: string; label: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProcess, {});

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="universityId" value={universityId} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="p-method">Applications are sent</Label>
          <Select id="p-method" name="applicationMethod" defaultValue={method.value ?? ""}>
            <option value="">Not set</option>
            {methods.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="p-url">Portal link</Label>
          <Input id="p-url" name="applicationUrl" type="url" defaultValue={method.url ?? ""} placeholder="https://…" />
        </div>
        <div>
          <Label htmlFor="p-email">Admissions email</Label>
          <Input id="p-email" name="applicationEmail" type="email" defaultValue={method.email ?? ""} />
        </div>
      </div>
      <div className="max-w-xs">
        <Label htmlFor="p-conf">Confirmation of enrolment is called</Label>
        <Input id="p-conf" name="confirmationName" maxLength={20} defaultValue={confirmationName} placeholder="CAS, I-20, CoE, LOA" />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Steps this university skips</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {stages.map((s) => <Checkbox key={s.value} name="skippedStages" value={s.value} defaultChecked={skipped.includes(s.value)}>{s.label}</Checkbox>)}
        </div>
      </fieldset>
      <div>
        <Label htmlFor="p-notes">How to apply (staff only)</Label>
        <Textarea id="p-notes" name="processNotes" maxLength={3000} rows={4} defaultValue={processNotes ?? ""} placeholder="Portal link, who to email, typical decision time…" />
      </div>
      <FormMessage state={state} />
      <SaveButton size="sm" disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Save process"}</SaveButton>
    </form>
  );
}

export function RequirementForm({ universityId, types }: { universityId: string; types: { value: string; label: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addRequirement, {});

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="universityId" value={universityId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="q-type">Kind of document</Label>
          <Select id="q-type" name="type" defaultValue="" required>
            <option value="" disabled>Choose…</option>
            {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="q-label">Name shown to the student</Label>
          <Input id="q-label" name="label" maxLength={120} placeholder="e.g. Portfolio (10 pieces)" />
        </div>
      </div>
      <div>
        <Label htmlFor="q-help">Instructions</Label>
        <Input id="q-help" name="instructions" maxLength={1000} placeholder="Optional" />
      </div>
      <Checkbox name="required" defaultChecked>Required before submitting</Checkbox>
      <KeepValuesOnError state={state} failed={Boolean(state.error)} />
      {state.error && <FormMessage state={state} />}
      <SaveButton size="sm" variant="glass" disabled={pending} className="justify-self-start">{pending ? "Adding…" : "Add to checklist"}</SaveButton>
    </form>
  );
}
