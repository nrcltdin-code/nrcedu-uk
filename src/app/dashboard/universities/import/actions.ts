"use server";

import { updateTag } from "next/cache";
import { importUniversities, type ImportResult } from "@/lib/university-import";
import { requirePermission } from "@/lib/session";

export async function importUniversitiesCsv(_previous: ImportResult, form: FormData): Promise<ImportResult> {
  await requirePermission("CONTENT", "edit");

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file to upload." };
  if (file.size > 5 * 1024 * 1024) return { error: "Keep the file under 5 MB (split it into smaller files)." };
  if (!/\.csv$/i.test(file.name)) return { error: "Upload a .csv file. In Excel, use File → Save As → CSV UTF-8." };

  const result = await importUniversities(await file.text());
  if (!result.error) {
    updateTag("universities");
    updateTag("subjects");
    updateTag("countries");
  }
  return result;
}
