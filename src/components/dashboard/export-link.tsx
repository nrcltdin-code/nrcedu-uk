import { buttonStyles } from "@/components/ui/button";

// Downloads every record of one kind as CSV (route: /api/export/[kind]). A plain link, not
// next/link, so the browser treats the response as a file.
export function ExportLink({ kind }: { kind: "leads" | "students" | "applications" | "commissions" }) {
  return (
    <a href={`/api/export/${kind}`} className={buttonStyles({ variant: "glass", size: "sm" })} title="All records, not only the ones shown">
      Download CSV
    </a>
  );
}
