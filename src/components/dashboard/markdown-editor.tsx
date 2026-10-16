"use client";

import { useRef, useState } from "react";
import { Prose } from "@/components/site/prose";
import { cn } from "@/lib/cn";

type Tool = { label: string; title: string; apply: (selected: string) => { text: string; select?: [number, number] } };

// Each tool wraps the selection, or inserts a placeholder and selects it for typing over.
const wrap = (before: string, after: string, placeholder: string) => (selected: string) => {
  const inner = selected || placeholder;
  return { text: `${before}${inner}${after}`, select: [before.length, before.length + inner.length] as [number, number] };
};
const linePrefix = (prefix: string, placeholder: string) => (selected: string) => {
  const lines = (selected || placeholder).split("\n");
  return { text: lines.map((line, i) => (prefix === "1. " ? `${i + 1}. ` : prefix) + line).join("\n") };
};

const tools: Tool[] = [
  { label: "H2", title: "Heading", apply: linePrefix("## ", "Heading") },
  { label: "H3", title: "Small heading", apply: linePrefix("### ", "Small heading") },
  { label: "B", title: "Bold", apply: wrap("**", "**", "bold text") },
  { label: "I", title: "Italic", apply: wrap("_", "_", "italic text") },
  { label: "Link", title: "Link", apply: wrap("[", "](https://)", "link text") },
  { label: "• List", title: "Bulleted list", apply: linePrefix("- ", "List item") },
  { label: "1. List", title: "Numbered list", apply: linePrefix("1. ", "List item") },
  { label: "Quote", title: "Quote", apply: linePrefix("> ", "Quote") },
];

type EditorProps = { id: string; name: string; defaultValue?: string; required?: boolean; maxLength?: number };

export function MarkdownEditor({ id, name, defaultValue = "", required, maxLength }: EditorProps) {
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  function use(tool: Tool) {
    const area = ref.current;
    if (!area) return;
    const { selectionStart: start, selectionEnd: end } = area;
    const { text, select } = tool.apply(value.slice(start, end));
    setValue(value.slice(0, start) + text + value.slice(end));
    requestAnimationFrame(() => {
      area.focus();
      if (select) area.setSelectionRange(start + select[0], start + select[1]);
      else area.setSelectionRange(start + text.length, start + text.length);
    });
  }

  const tab = (active: boolean) =>
    cn("rounded-lg px-3 py-1.5 text-sm font-semibold", active ? "bg-white text-brand-800 shadow-sm" : "text-muted hover:text-ink");

  return (
    <div className="overflow-hidden rounded-xl border border-brand-900/20 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-brand-900/10 bg-brand-600/5 p-1.5">
        <button type="button" className={tab(!preview)} onClick={() => setPreview(false)}>Write</button>
        <button type="button" className={tab(preview)} onClick={() => setPreview(true)}>Preview</button>
        {!preview && (
          <div className="ml-auto flex flex-wrap gap-0.5">
            {tools.map((tool) => (
              <button
                key={tool.label}
                type="button"
                title={tool.title}
                onClick={() => use(tool)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-brand-800 hover:bg-white"
              >
                {tool.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* The textarea stays mounted (hidden in preview) so the form always submits it. */}
      <textarea
        ref={ref}
        id={id}
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        required={required}
        maxLength={maxLength}
        className={cn("block min-h-96 w-full resize-y bg-transparent px-4 py-3 font-mono text-sm leading-relaxed text-ink focus:outline-none", preview && "hidden")}
      />
      {preview && (
        <div className="min-h-96 bg-white/70 px-6 py-5">
          {value.trim() ? <Prose text={value} /> : <p className="text-muted">Nothing to preview yet.</p>}
        </div>
      )}
      <p className="border-t border-brand-900/10 px-4 py-2 text-xs text-muted">
        Leave a blank line between paragraphs. Use the buttons to format, then check Preview.
      </p>
    </div>
  );
}
