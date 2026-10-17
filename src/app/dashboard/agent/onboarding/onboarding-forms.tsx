"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { KeepValuesOnError } from "@/components/ui/keep-values-on-error";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { saveOnboardingProfile, submitForReview } from "./actions";

export type OnboardingProfile = {
  kind: "INDIVIDUAL" | "AGENCY";
  name: string;
  phone: string;
  companyName: string;
  registrationNumber: string;
  website: string;
  countryId: string;
  address: string;
  about: string;
  yearsActive: string;
  studentsPerYear: string;
};

export function OnboardingProfileForm({ profile, countries }: { profile: OnboardingProfile; countries: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveOnboardingProfile, {});
  const [kind, setKind] = useState(profile.kind);

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="o-kind">Registering as</Label>
          <Select id="o-kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value as OnboardingProfile["kind"])}>
            <option value="INDIVIDUAL">An individual agent</option>
            <option value="AGENCY">An agency (with staff)</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="o-name">Your full name</Label>
          <Input id="o-name" name="name" defaultValue={profile.name} maxLength={100} required />
        </div>
        <div>
          <Label htmlFor="o-company">{kind === "AGENCY" ? "Agency name" : "Trading name (optional)"}</Label>
          <Input id="o-company" name="companyName" defaultValue={profile.companyName} maxLength={150} required={kind === "AGENCY"} />
        </div>
        {kind === "AGENCY" && (
          <div>
            <Label htmlFor="o-reg">Business registration number</Label>
            <Input id="o-reg" name="registrationNumber" defaultValue={profile.registrationNumber} maxLength={60} />
          </div>
        )}
        <div>
          <Label htmlFor="o-phone">Phone or WhatsApp</Label>
          <Input id="o-phone" name="phone" type="tel" defaultValue={profile.phone} maxLength={30} required />
        </div>
        <div>
          <Label htmlFor="o-web">Website</Label>
          <Input id="o-web" name="website" type="url" defaultValue={profile.website} placeholder="https://" maxLength={200} />
        </div>
        <div>
          <Label htmlFor="o-country">Country you work in</Label>
          <Select id="o-country" name="countryId" defaultValue={profile.countryId} required>
            <option value="" disabled>Choose…</option>
            {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="o-address">Office address</Label>
          <Input id="o-address" name="address" defaultValue={profile.address} maxLength={300} />
        </div>
        <div>
          <Label htmlFor="o-years">Years recruiting students</Label>
          <Input id="o-years" name="yearsActive" inputMode="numeric" defaultValue={profile.yearsActive} />
        </div>
        <div>
          <Label htmlFor="o-per-year">Students you send per year</Label>
          <Input id="o-per-year" name="studentsPerYear" inputMode="numeric" defaultValue={profile.studentsPerYear} />
        </div>
      </div>
      <div>
        <Label htmlFor="o-about">About your experience</Label>
        <Textarea id="o-about" name="about" defaultValue={profile.about} minLength={20} maxLength={2000} required />
      </div>
      <FormMessage state={state} />
      <Button type="submit" variant="glass" disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Save profile"}</Button>
    </form>
  );
}

export function SubmitForReview({ again }: { again: boolean }) {
  const [state, action, pending] = useActionState<FormState>(submitForReview, {});
  if (state.saved) return <p role="status" className="text-sm text-emerald-800">Sent. We will email you when we have reviewed it.</p>;
  return (
    <form action={action} className="grid gap-3">
      <KeepValuesOnError state={state} failed={Boolean(state.error)} />
      {state.error && <FormMessage state={state} />}
      <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Sending…" : again ? "Send for review again" : "Send for review"}</Button>
    </form>
  );
}
