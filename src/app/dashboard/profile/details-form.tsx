"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { saveMyDetails } from "./actions";

export type MyDetails = {
  name: string;
  email: string;
  phone: string | null;
  countryId: string | null;
  dateOfBirth: string;
  gender: string | null;
  nationality: string | null;
  passportNumber: string | null;
  passportExpiry: string;
  address: string | null;
};

type Props = {
  details: MyDetails;
  countries: { id: string; name: string }[];
  // For an agent editing their student; the student portal leaves these out.
  studentId?: string;
  submit?: (previous: FormState, form: FormData) => Promise<FormState>;
};

export function MyDetailsForm({ details, countries, studentId, submit = saveMyDetails }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(submit, {});

  return (
    <form action={action} className="grid gap-4">
      {studentId && <input type="hidden" name="id" value={studentId} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="m-name">Full name (as on your passport)</Label>
          <Input id="m-name" name="name" defaultValue={details.name} maxLength={100} required autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="m-email">Email</Label>
          <Input id="m-email" value={details.email} disabled />
        </div>
        <div>
          <Label htmlFor="m-phone">Phone (with country code)</Label>
          <Input id="m-phone" name="phone" type="tel" defaultValue={details.phone ?? ""} maxLength={30} autoComplete="tel" />
        </div>
        <div>
          <Label htmlFor="m-country">Country you live in</Label>
          <Select id="m-country" name="countryId" defaultValue={details.countryId ?? ""}>
            <option value="">Choose…</option>
            {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="m-dob">Date of birth</Label>
          <Input id="m-dob" name="dateOfBirth" type="date" defaultValue={details.dateOfBirth} />
        </div>
        <div>
          <Label htmlFor="m-gender">Gender</Label>
          <Input id="m-gender" name="gender" defaultValue={details.gender ?? ""} maxLength={30} />
        </div>
        <div>
          <Label htmlFor="m-nationality">Nationality</Label>
          <Input id="m-nationality" name="nationality" defaultValue={details.nationality ?? ""} maxLength={60} />
        </div>
        <div>
          <Label htmlFor="m-passport">Passport number</Label>
          <Input id="m-passport" name="passportNumber" defaultValue={details.passportNumber ?? ""} maxLength={30} autoComplete="off" />
        </div>
        <div>
          <Label htmlFor="m-passport-expiry">Passport expiry date</Label>
          <Input id="m-passport-expiry" name="passportExpiry" type="date" defaultValue={details.passportExpiry} />
        </div>
      </div>
      <div>
        <Label htmlFor="m-address">Home address</Label>
        <Textarea id="m-address" name="address" defaultValue={details.address ?? ""} maxLength={300} className="min-h-20" autoComplete="street-address" />
      </div>
      <FormMessage state={state} />
      <SaveButton disabled={pending} className="justify-self-start">{pending ? "Saving…" : studentId ? "Save details" : "Save my details"}</SaveButton>
    </form>
  );
}
