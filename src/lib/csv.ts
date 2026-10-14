import "server-only";

type Cell = string | number | Date | boolean | null | undefined;

// Spreadsheet apps run cells starting with = + - @ (or tab / return) as formulas, so a
// visitor typing "=HYPERLINK(…)" into a form could plant one. Such cells get a leading '.
function cell(value: Cell) {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString().replace("T", " ").slice(0, 16) : String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// A CSV download that opens correctly in Excel (UTF-8 marker, Windows line endings).
export function csvResponse(name: string, header: string[], rows: Cell[][]) {
  const body = "﻿" + [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
  const date = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nrc-${name}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
