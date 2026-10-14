"use server";

import { isStudyLevel } from "@/lib/data/catalogue";
import { db } from "@/lib/db";
import { createLead, isEmail } from "@/lib/leads";

export type ConsultationState = { status: "idle" | "sent" } | { status: "error"; error: string };

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const fail = (error: string): ConsultationState => ({ status: "error", error });

export async function requestConsultation(_previous: ConsultationState, form: FormData): Promise<ConsultationState> {
  if (text(form, "website")) return { status: "sent" };

  const name = text(form, "name");
  const email = text(form, "email");
  const phone = text(form, "phone");
  const countryId = text(form, "countryId");
  const destinationCountryId = text(form, "destinationCountryId");
  const level = text(form, "studyLevel");
  const message = text(form, "message");

  if (name.length < 2 || name.length > 100) return fail("Enter your full name.");
  if (!isEmail(email)) return fail("Enter a valid email address.");
  if (phone.length < 6 || phone.length > 30) return fail("Enter a phone number we can reach you on.");
  if (!countryId) return fail("Choose the country you live in.");
  if (level && !isStudyLevel(level)) return fail("Choose a study level from the list.");
  if (message.length > 2000) return fail("Keep your message under 2,000 characters.");

  // Only accept countries that exist, and only real destinations as the place to study.
  const [country, destination] = await Promise.all([
    db.country.findUnique({ where: { id: countryId }, select: { id: true } }),
    destinationCountryId
      ? db.country.findFirst({ where: { id: destinationCountryId, isDestination: true }, select: { id: true } })
      : null,
  ]);
  if (!country) return fail("Choose the country you live in.");
  if (destinationCountryId && !destination) return fail("Choose a study destination from the list.");

  try {
    await createLead({
      name,
      email,
      phone,
      message,
      source: "CONSULTATION_FORM",
      countryId: country.id,
      destinationCountryId: destination?.id,
      studyLevel: level && isStudyLevel(level) ? level : undefined,
    });
  } catch (error) {
    console.error("Consultation form: could not save lead", error);
    return fail("We could not send your request. Please try again, or call us.");
  }
  return { status: "sent" };
}
