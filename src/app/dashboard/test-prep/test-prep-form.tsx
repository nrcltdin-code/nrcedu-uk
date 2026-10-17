"use client";

import { useActionState, useState } from "react";
import { Checkbox, FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { InfoTip } from "@/components/ui/info-tip";
import type { FormState } from "@/lib/form";
import type { ScoreTable, TestFact } from "@/lib/test-prep";
import { saveTestPrep } from "./actions";

export type TestPrepValues = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  content: string;
  sortOrder: number;
  isPublished: boolean;
  facts: TestFact[];
  tables: ScoreTable[];
};

const blankTable = (): ScoreTable => ({ title: "", columns: ["Section", "Questions", "Time", "Marks"], rows: [["", "", "", ""]] });
const cell = "h-9 min-w-24 rounded-lg border border-brand-900/15 bg-white/80 px-2 text-sm";

function FactsEditor({ facts, onChange }: { facts: TestFact[]; onChange: (f: TestFact[]) => void }) {
  const set = (i: number, key: keyof TestFact, value: string) => onChange(facts.map((f, j) => (j === i ? { ...f, [key]: value } : f)));
  return (
    <div className="grid gap-2">
      {facts.map((f, i) => (
        <div key={i} className="flex gap-2">
          <input aria-label="Fact" className={`${cell} w-40`} value={f.label} placeholder="e.g. Duration" onChange={(e) => set(i, "label", e.target.value)} />
          <input aria-label="Value" className={`${cell} flex-1`} value={f.value} placeholder="e.g. 2 hours 45 minutes" onChange={(e) => set(i, "value", e.target.value)} />
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange(facts.filter((_, j) => j !== i))} aria-label="Remove fact">✕</Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="glass" className="justify-self-start" onClick={() => onChange([...facts, { label: "", value: "" }])}>Add a fact</Button>
    </div>
  );
}

function TableEditor({ table, onChange, onRemove }: { table: ScoreTable; onChange: (t: ScoreTable) => void; onRemove: () => void }) {
  const setCol = (c: number, value: string) => onChange({ ...table, columns: table.columns.map((v, i) => (i === c ? value : v)) });
  const setCell = (r: number, c: number, value: string) => onChange({ ...table, rows: table.rows.map((row, i) => (i === r ? row.map((v, j) => (j === c ? value : v)) : row)) });
  const addCol = () => onChange({ columns: [...table.columns, ""], rows: table.rows.map((row) => [...row, ""]), title: table.title, note: table.note });
  const removeCol = (c: number) => onChange({ ...table, columns: table.columns.filter((_, i) => i !== c), rows: table.rows.map((row) => row.filter((_, i) => i !== c)) });
  const moveRow = (r: number, by: number) => {
    const rows = [...table.rows];
    const to = r + by;
    if (to < 0 || to >= rows.length) return;
    [rows[r], rows[to]] = [rows[to], rows[r]];
    onChange({ ...table, rows });
  };

  return (
    <div className="grid gap-3 rounded-2xl border border-brand-900/10 p-4">
      <div className="flex gap-2">
        <input aria-label="Table title" className={`${cell} flex-1 font-semibold`} value={table.title} placeholder="Table title, e.g. Marks distribution" onChange={(e) => onChange({ ...table, title: e.target.value })} />
        <Button type="button" size="sm" variant="ghost" className="text-red-700" onClick={onRemove}>Remove table</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-1">
          <thead>
            <tr>
              {table.columns.map((c, i) => (
                <th key={i} className="align-top">
                  <input aria-label={`Column ${i + 1}`} className={`${cell} font-semibold`} value={c} placeholder={`Column ${i + 1}`} onChange={(e) => setCol(i, e.target.value)} />
                  {table.columns.length > 1 && <button type="button" onClick={() => removeCol(i)} className="block w-full text-xs font-normal text-muted hover:text-red-700">remove column</button>}
                </th>
              ))}
              <th className="align-top">{table.columns.length < 8 && <Button type="button" size="sm" variant="ghost" onClick={addCol}>+ column</Button>}</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, r) => (
              <tr key={r}>
                {row.map((v, c) => (
                  <td key={c}><input aria-label={`Row ${r + 1}, ${table.columns[c] || `column ${c + 1}`}`} className={cell} value={v} onChange={(e) => setCell(r, c, e.target.value)} /></td>
                ))}
                <td className="whitespace-nowrap">
                  <button type="button" onClick={() => moveRow(r, -1)} className="px-1 text-muted hover:text-ink" aria-label="Move row up">↑</button>
                  <button type="button" onClick={() => moveRow(r, 1)} className="px-1 text-muted hover:text-ink" aria-label="Move row down">↓</button>
                  <button type="button" onClick={() => onChange({ ...table, rows: table.rows.filter((_, i) => i !== r) })} className="px-1 text-muted hover:text-red-700" aria-label="Remove row">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" size="sm" variant="glass" className="justify-self-start" onClick={() => onChange({ ...table, rows: [...table.rows, table.columns.map(() => "")] })}>Add a row</Button>
      <input aria-label="Note under the table" className={cell} value={table.note ?? ""} placeholder="Note under the table (optional), e.g. Band scores are rounded to the nearest 0.5" onChange={(e) => onChange({ ...table, note: e.target.value })} />
    </div>
  );
}

export function TestPrepForm({ test }: { test: TestPrepValues | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveTestPrep, {});
  const [facts, setFacts] = useState<TestFact[]>(test?.facts ?? []);
  const [tables, setTables] = useState<ScoreTable[]>(test?.tables ?? []);

  return (
    <form action={action} className="grid gap-6">
      {test && <input type="hidden" name="id" value={test.id} />}
      <input type="hidden" name="facts" value={JSON.stringify(facts)} />
      <input type="hidden" name="tables" value={JSON.stringify(tables)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="t-name">Test name</Label>
          <Input id="t-name" name="name" defaultValue={test?.name} maxLength={60} required placeholder="IELTS Academic" />
        </div>
        <div>
          <Label htmlFor="t-slug">Web address</Label>
          <Input id="t-slug" name="slug" defaultValue={test?.slug} maxLength={60} placeholder="made from the name, e.g. ielts" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="t-summary">Summary (shown on the list and in the menu)</Label>
          <Input id="t-summary" name="summary" defaultValue={test?.summary} maxLength={300} />
        </div>
        <div>
          <Label htmlFor="t-order">Position in the menu</Label>
          <Input id="t-order" name="sortOrder" type="number" defaultValue={test?.sortOrder ?? 0} />
        </div>
        <div className="self-end pb-2">
          <Checkbox name="isPublished" defaultChecked={test?.isPublished ?? false}>Show on the website</Checkbox>
        </div>
      </div>

      <section className="grid gap-2">
        <h3 className="flex items-center gap-1 font-semibold">Key facts <InfoTip text="Short facts shown in a box beside the guide: duration, fee, score range, how long results are valid, and so on." /></h3>
        <FactsEditor facts={facts} onChange={setFacts} />
      </section>

      <section className="grid gap-3">
        <h3 className="flex items-center gap-1 font-semibold">Marks distribution tables <InfoTip text="Add as many tables as you need: sections and marks, band score conversion, what each university asks for. Name the columns, then fill in the rows. Empty rows are left out when you save." /></h3>
        {tables.map((t, i) => (
          <TableEditor key={i} table={t} onChange={(next) => setTables(tables.map((x, j) => (j === i ? next : x)))} onRemove={() => setTables(tables.filter((_, j) => j !== i))} />
        ))}
        <Button type="button" size="sm" variant="glass" className="justify-self-start" onClick={() => setTables([...tables, blankTable()])}>Add a table</Button>
      </section>

      <div>
        <Label htmlFor="t-content" className="flex items-center gap-1">Guide text <InfoTip text="The main article. Markdown works: ## for headings, - for lists, **bold**. The tables above appear between the summary and this text." /></Label>
        <Textarea id="t-content" name="content" defaultValue={test?.content} rows={14} maxLength={30000} />
      </div>

      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Saving…" : test ? "Save changes" : "Add test"}</Button>
    </form>
  );
}
