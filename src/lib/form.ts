import { Prisma } from "@/generated/prisma/client";
import { imageHosts, isAllowedImageUrl } from "@/lib/image-hosts";

// Small helpers shared by the dashboard's server actions.

export type FormState = { error?: string; saved?: boolean };

export const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
export const checked = (form: FormData, key: string) => form.get(key) === "on";

export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const isSlug = (value: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);

// Empty → null; otherwise a whole number, or undefined when it is not one.
export function optionalInt(value: string): number | null | undefined {
  if (!value) return null;
  const number = Number(value);
  return Number.isInteger(number) ? number : undefined;
}

// Empty → null; otherwise a non-negative number, or undefined when it is not one.
export function optionalNumber(value: string): number | null | undefined {
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

export function imageError(value: string, label: string) {
  if (!value || isAllowedImageUrl(value)) return null;
  return `${label} must start with https:// and come from: ${imageHosts.join(", ")}.`;
}

export function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export const isUniqueError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

export const isInUseError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2003" || error.code === "P2014");

// "YYYY-MM-DD" from a date input → Date at midnight UTC; empty → null; invalid → undefined.
export function optionalDate(value: string): Date | null | undefined {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
