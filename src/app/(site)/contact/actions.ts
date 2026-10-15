"use server";

import { createLead, isEmail } from "@/lib/leads";
import { withinLimit } from "@/lib/rate-limit";

export type ContactFormState = { status: "idle" | "sent" } | { status: "error"; error: string };

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function sendContactMessage(_previous: ContactFormState, form: FormData): Promise<ContactFormState> {
  // Hidden field that people never see or fill in; automated spam usually does.
  if (text(form, "website")) return { status: "sent" };

  const name = text(form, "name");
  const email = text(form, "email");
  const phone = text(form, "phone");
  const message = text(form, "message");

  if (name.length < 2 || name.length > 100) return { status: "error", error: "Enter your full name." };
  if (!isEmail(email)) return { status: "error", error: "Enter a valid email address." };
  if (phone.length > 30) return { status: "error", error: "Enter a valid phone number." };
  if (message.length < 10) return { status: "error", error: "Tell us a little more in your message." };
  if (message.length > 2000) return { status: "error", error: "Keep your message under 2,000 characters." };

  if (!(await withinLimit("contact", 5, 3600))) {
    return { status: "error", error: "Too many messages from your connection. Please try again in an hour, or email us directly." };
  }

  try {
    await createLead({ name, email, phone, message, source: "CONTACT_FORM" });
  } catch (error) {
    console.error("Contact form: could not save lead", error);
    return { status: "error", error: "We could not send your message. Please try again, or email us directly." };
  }
  return { status: "sent" };
}
