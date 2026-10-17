// Test prep pages carry two editable structures besides the text: key facts (label/value)
// and mark distribution tables. Both are stored as JSON; these helpers check and clean them,
// so a page never renders (or saves) a malformed table.

export type TestFact = { label: string; value: string };
export type ScoreTable = { title: string; columns: string[]; rows: string[][]; note?: string };

const str = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export function parseFacts(value: unknown): TestFact[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((f) => ({ label: str(f?.label, 60), value: str(f?.value, 200) }))
    .filter((f) => f.label && f.value)
    .slice(0, 20);
}

// Rows are padded or cut to the number of columns; empty rows and empty tables are dropped.
export function parseTables(value: unknown): ScoreTable[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((t) => {
      const columns = (Array.isArray(t?.columns) ? t.columns : []).map((c: unknown) => str(c, 60)).slice(0, 8);
      while (columns.length && !columns[columns.length - 1]) columns.pop();
      const rows = (Array.isArray(t?.rows) ? t.rows : [])
        .map((row: unknown) => Array.from({ length: columns.length }, (_, i) => str(Array.isArray(row) ? row[i] : "", 200)))
        .filter((row: string[]) => row.some(Boolean))
        .slice(0, 40);
      const note = str(t?.note, 300);
      return { title: str(t?.title, 100), columns, rows, ...(note && { note }) };
    })
    .filter((t) => t.columns.length > 0 && t.rows.length > 0)
    .slice(0, 10);
}
