import Markdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders article text written in Markdown. Raw HTML in the text is ignored, so content
// typed into the dashboard cannot inject scripts. Plain text works too: a blank line
// starts a new paragraph. Inline images wait for uploads (task 3.4).
const components: Components = {
  h2: (props) => <h2 className="mt-10 text-2xl font-bold text-ink" {...props} />,
  h3: (props) => <h3 className="mt-8 text-xl font-bold text-ink" {...props} />,
  a: ({ href = "", ...props }) => {
    const external = /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...props}
      />
    );
  },
  ul: (props) => <ul className="list-disc space-y-2 pl-6" {...props} />,
  ol: (props) => <ol className="list-decimal space-y-2 pl-6" {...props} />,
  blockquote: (props) => <blockquote className="border-l-4 border-brand-400 pl-4 italic text-muted" {...props} />,
  table: (props) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-base" {...props} />
    </div>
  ),
  th: (props) => <th className="border-b border-brand-900/15 px-3 py-2 text-left font-semibold" {...props} />,
  td: (props) => <td className="border-b border-brand-900/10 px-3 py-2" {...props} />,
  hr: () => <hr className="border-brand-900/10" />,
};

export function Prose({ text }: { text: string }) {
  return (
    <div className="space-y-5 text-lg leading-relaxed text-ink/85 [&_strong]:font-semibold [&_strong]:text-ink">
      <Markdown remarkPlugins={[remarkGfm]} components={components} disallowedElements={["img"]} unwrapDisallowed>
        {text}
      </Markdown>
    </div>
  );
}
