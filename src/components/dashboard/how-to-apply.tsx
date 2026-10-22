import type { ApplicationMethod } from "@/generated/prisma/client";
import { applicationMethodLabels } from "@/lib/application-method";

// How a university receives applications, for staff. Set on the university's Process section.
export function HowToApply({ name, method, url, email, notes }: {
  name: string;
  method: ApplicationMethod | null;
  url: string | null;
  email: string | null;
  notes: string | null;
}) {
  if (!method && !url && !email && !notes) {
    return <p className="text-sm text-muted">No application process saved for {name} yet. Add it on the university&apos;s page.</p>;
  }
  return (
    <div className="rounded-xl bg-brand-600/8 px-4 py-3 text-sm">
      <p className="font-semibold">How {name} takes applications</p>
      <ul className="mt-1 grid gap-0.5">
        {method && <li>Send via: {applicationMethodLabels[method]}</li>}
        {url && <li>Portal: <a href={url} target="_blank" rel="noopener noreferrer" className="break-all text-brand-700 hover:underline">{url}</a></li>}
        {email && <li>Email: <a href={`mailto:${email}`} className="text-brand-700 hover:underline">{email}</a></li>}
      </ul>
      {notes && <p className="mt-2 whitespace-pre-line">{notes}</p>}
    </div>
  );
}
