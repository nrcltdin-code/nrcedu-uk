"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { createApplication } from "../applications/actions";
import { addStudent, updateStudent } from "./actions";

type Option = { id: string; name: string };

function PeopleSelects({ counsellors, agents, counsellorId, agentId }: { counsellors: Option[]; agents: Option[]; counsellorId?: string | null; agentId?: string | null }) {
  return (
    <>
      <div>
        <Label htmlFor="s-counsellor">Counsellor</Label>
        <Select id="s-counsellor" name="counsellorId" defaultValue={counsellorId ?? ""}>
          <option value="">Not assigned</option>
          {counsellors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>
      <div>
        <Label htmlFor="s-agent">Agent</Label>
        <Select id="s-agent" name="agentId" defaultValue={agentId ?? ""}>
          <option value="">None</option>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
      </div>
    </>
  );
}

function CountrySelect({ countries, value }: { countries: Option[]; value?: string | null }) {
  return (
    <div>
      <Label htmlFor="s-country">Lives in</Label>
      <Select id="s-country" name="countryId" defaultValue={value ?? ""}>
        <option value="">Not known</option>
        {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
    </div>
  );
}

type PeopleProps = { countries: Option[]; counsellors: Option[]; agents: Option[] };

export function NewStudentForm({ countries, counsellors, agents }: PeopleProps) {
  const [state, action, pending] = useActionState<FormState, FormData>(addStudent, {});

  return (
    <form action={action} className="grid gap-4">
      <div>
        <Label htmlFor="s-name">Name</Label>
        <Input id="s-name" name="name" maxLength={100} required />
      </div>
      <div>
        <Label htmlFor="s-email">Email</Label>
        <Input id="s-email" name="email" type="email" maxLength={254} required />
      </div>
      <div>
        <Label htmlFor="s-phone">Phone</Label>
        <Input id="s-phone" name="phone" type="tel" maxLength={30} />
      </div>
      <CountrySelect countries={countries} />
      <PeopleSelects counsellors={counsellors} agents={agents} />
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Adding…" : "Add student"}</Button>
    </form>
  );
}

export type StudentValues = {
  id: string;
  name: string;
  phone: string | null;
  countryId: string | null;
  counsellorId: string | null;
  agentId: string | null;
  dateOfBirth: string;
  gender: string | null;
  nationality: string | null;
  passportNumber: string | null;
  passportExpiry: string;
  address: string | null;
};

export function StudentForm({ student, countries, counsellors, agents }: PeopleProps & { student: StudentValues }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateStudent, {});

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={student.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="s-name">Name</Label>
          <Input id="s-name" name="name" defaultValue={student.name} maxLength={100} required />
        </div>
        <div>
          <Label htmlFor="s-phone">Phone</Label>
          <Input id="s-phone" name="phone" type="tel" defaultValue={student.phone ?? ""} maxLength={30} />
        </div>
        <div>
          <Label htmlFor="s-dob">Date of birth</Label>
          <Input id="s-dob" name="dateOfBirth" type="date" defaultValue={student.dateOfBirth} />
        </div>
        <div>
          <Label htmlFor="s-gender">Gender</Label>
          <Input id="s-gender" name="gender" defaultValue={student.gender ?? ""} maxLength={30} />
        </div>
        <div>
          <Label htmlFor="s-nationality">Nationality</Label>
          <Input id="s-nationality" name="nationality" defaultValue={student.nationality ?? ""} maxLength={60} />
        </div>
        <CountrySelect countries={countries} value={student.countryId} />
        <div>
          <Label htmlFor="s-passport">Passport number</Label>
          <Input id="s-passport" name="passportNumber" defaultValue={student.passportNumber ?? ""} maxLength={30} autoComplete="off" />
        </div>
        <div>
          <Label htmlFor="s-passport-expiry">Passport expiry</Label>
          <Input id="s-passport-expiry" name="passportExpiry" type="date" defaultValue={student.passportExpiry} />
        </div>
        <PeopleSelects counsellors={counsellors} agents={agents} counsellorId={student.counsellorId} agentId={student.agentId} />
      </div>
      <div>
        <Label htmlFor="s-address">Address</Label>
        <Textarea id="s-address" name="address" defaultValue={student.address ?? ""} maxLength={300} className="min-h-20" />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Save profile"}</Button>
    </form>
  );
}

type CourseOption = { id: string; name: string; universityId: string; university: string };
type IntakeOption = { id: string; name: string; universityId: string; courseId: string | null };

type NewApplicationProps = {
  studentId: string;
  courses: CourseOption[];
  intakes: IntakeOption[];
  // Staff by default; the agent portal passes its own action.
  submit?: (previous: FormState, form: FormData) => Promise<FormState>;
  // Preselected course, e.g. when coming from the course finder.
  initialCourseId?: string;
};

export function NewApplicationForm({ studentId, courses, intakes, submit = createApplication, initialCourseId = "" }: NewApplicationProps) {
  const [state, action, pending] = useActionState<FormState, FormData>(submit, {});
  const [courseId, setCourseId] = useState(courses.some((c) => c.id === initialCourseId) ? initialCourseId : "");
  const course = courses.find((c) => c.id === courseId);
  const courseIntakes = course ? intakes.filter((i) => i.universityId === course.universityId && (!i.courseId || i.courseId === course.id)) : [];

  const universities = [...new Set(courses.map((c) => c.university))];

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="studentId" value={studentId} />
      <div>
        <Label htmlFor="a-course">Course</Label>
        <Select id="a-course" name="courseId" value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
          <option value="" disabled>Choose…</option>
          {universities.map((university) => (
            <optgroup key={university} label={university}>
              {courses.filter((c) => c.university === university).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </optgroup>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="a-intake">Intake</Label>
        <Select id="a-intake" name="intakeId" key={courseId} defaultValue="" disabled={!course}>
          <option value="">{course && courseIntakes.length === 0 ? "No open intakes listed" : "Not decided"}</option>
          {courseIntakes.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </Select>
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Starting…" : "Start application"}</Button>
    </form>
  );
}
