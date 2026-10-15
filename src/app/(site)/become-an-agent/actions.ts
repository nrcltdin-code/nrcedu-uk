"use server";

import { hashPassword } from "better-auth/crypto";
import { db } from "@/lib/db";
import { link, queueEmail, staffAlertAddresses } from "@/lib/email";
import { isEmail } from "@/lib/leads";
import { notify, staffWithAccess } from "@/lib/notifications";
import { withinLimit } from "@/lib/rate-limit";

export type AgentFormState = { status: "idle" | "sent" } | { status: "error"; error: string };

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const fail = (error: string): AgentFormState => ({ status: "error", error });

// Creates a sign-in for the agent that stays locked (status PENDING) until an admin approves
// the application; lib/auth.ts refuses sign-in for pending accounts.
export async function applyAsAgent(_previous: AgentFormState, form: FormData): Promise<AgentFormState> {
  if (text(form, "website")) return { status: "sent" };

  const name = text(form, "name");
  const email = text(form, "email").toLowerCase();
  const phone = text(form, "phone");
  const companyName = text(form, "companyName");
  const countryId = text(form, "countryId");
  const address = text(form, "address");
  const about = text(form, "about");
  // Passwords are not trimmed: spaces may be intentional.
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirmPassword") ?? "");

  if (name.length < 2 || name.length > 100) return fail("Enter your full name.");
  if (!isEmail(email)) return fail("Enter a valid email address.");
  if (phone.length < 6 || phone.length > 30) return fail("Enter a phone number we can reach you on.");
  if (companyName.length > 150) return fail("Keep the company name under 150 characters.");
  if (!countryId) return fail("Choose the country you work in.");
  if (address.length > 300) return fail("Keep the address under 300 characters.");
  if (about.length < 20) return fail("Tell us a little more about your experience (at least 20 characters).");
  if (about.length > 2000) return fail("Keep your description under 2,000 characters.");
  if (password.length < 8 || password.length > 128) return fail("Choose a password of at least 8 characters.");
  if (password !== confirm) return fail("The two passwords do not match.");

  if (!(await withinLimit("agent", 3, 3600))) return fail("Too many applications from your connection. Please try again in an hour.");

  const country = await db.country.findUnique({ where: { id: countryId }, select: { id: true } });
  if (!country) return fail("Choose the country you work in.");

  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return fail("An account with this email already exists. Sign in, or use a different email.");
  }

  try {
    const passwordHash = await hashPassword(password);
    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, phone, role: "AGENT", status: "PENDING" },
      });
      await tx.account.create({
        data: { userId: user.id, accountId: user.id, providerId: "credential", password: passwordHash },
      });
      await tx.agentProfile.create({
        data: { userId: user.id, companyName: companyName || null, countryId: country.id, phone, address: address || null, about },
      });
    });
  } catch (error) {
    console.error("Agent application: could not save", error);
    return fail("We could not submit your application. Please try again.");
  }
  notify(await staffWithAccess("AGENTS", "edit"), {
    type: "agent.applied",
    title: `New agent application: ${companyName || name}`,
    body: "Review it and approve or reject.",
    href: "/dashboard/agents",
  });
  queueEmail(
    {
      to: staffAlertAddresses(),
      replyTo: email,
      subject: `New agent application: ${companyName || name}`,
      text: `${name}${companyName ? ` (${companyName})` : ""} applied to become an agent.\n\nEmail: ${email}\nPhone: ${phone}\n\n${about}\n\nReview it: ${link("/dashboard/agents")}`,
    },
    {
      to: email,
      subject: "We received your agent application",
      text: `Hello ${name},\n\nThank you for applying to become an NRC agent. We will review your application and email you once your account is approved.`,
    },
  );
  return { status: "sent" };
}
