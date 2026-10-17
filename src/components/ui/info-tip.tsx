import { Icon } from "@/components/ui/icon";

// A small ⓘ that explains what a section or button does, on hover or keyboard focus.
// align: which edge the bubble lines up with; "left" for headings, "right" near the right edge.
export function InfoTip({ text, align = "left" }: { text: string; align?: "left" | "right" }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button type="button" aria-label={text} className="inline-flex size-7 items-center justify-center rounded-full text-muted hover:bg-brand-600/10 hover:text-brand-700 focus-visible:outline-2">
        <Icon name="help" className="size-4" />
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full z-20 mb-2 w-64 rounded-xl bg-brand-950 px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${align === "left" ? "left-0" : "right-0"}`}
      >
        {text}
      </span>
    </span>
  );
}
