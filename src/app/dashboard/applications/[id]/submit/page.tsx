import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { InfoTip } from "@/components/ui/info-tip";
import { stages } from "@/lib/application-flow";
import { applicationMethodLabels } from "@/lib/application-method";
import { emailEnabled } from "@/lib/email";
import { can, requirePermission } from "@/lib/session";
import { privateStorageEnabled } from "@/lib/storage";
import { buildSubmissionPack, packText, submissionCode } from "@/lib/submission";
import type { SubmissionPack } from "@/lib/submission";
import { CopyAllButton, CopyField, EmailForm, PrintButton, RecordForm } from "./submit-forms";

export const metadata: Metadata = { title: "Submit application", robots: { index: false } };

export default function SubmitPage({ params }: PageProps<"/dashboard/applications/[id]/submit">) {
  return (
    <Suspense fallback={<Card tone="solid" className="mt-6">Loading…</Card>}>
      <Submit params={params} />
    </Suspense>
  );
}

function emailBody(pack: SubmissionPack, sender: string) {
  const intake = pack.intakeName ? ` for the ${pack.intakeName} intake` : "";
  const docs = pack.documents.length ? `\n\nAttached documents:\n${pack.documents.map((d) => `  - ${d.fileName}`).join("\n")}` : "";
  return `Dear Admissions Team,

Please find below the application of ${pack.studentName} for ${pack.courseName}${intake}, submitted by NRC Educational Consultant on the student's behalf.

${packText(pack)}${docs}

Please quote ${submissionCode(pack.id)} in any reply. If you need anything else, reply to this email and we will send it promptly.

Kind regards,
${sender}
NRC Educational Consultant`;
}

async function Submit({ params }: Pick<PageProps<"/dashboard/applications/[id]/submit">, "params">) {
  const user = await requirePermission("APPLICATIONS", "view");
  const canEdit = await can(user, "APPLICATIONS", "edit");
  const { id } = await params;
  const pack = await buildSubmissionPack(id);
  if (!pack) notFound();

  const { university } = pack;
  const ready = pack.blockers.length === 0;
  const submitted = stages.indexOf(pack.stage) >= stages.indexOf("SUBMITTED_TO_UNIVERSITY");
  const method = university.applicationMethod;
  const intake = pack.intakeName ? ` (${pack.intakeName})` : "";
  const methods = Object.entries(applicationMethodLabels).map(([value, label]) => ({ value, label }));

  const emailCard = (
    <Card tone="solid" className="print:hidden">
      <h2 className="mb-1 flex items-center gap-1 text-xl font-bold">Send by email <InfoTip text="Emails the application summary and the ticked documents to the university from the site's address. You are copied in and replies come to you. A code in the subject links replies to this application." /></h2>
      {!emailEnabled && <p className="mb-3 text-sm text-red-800">Email is not set up on this site yet, so this cannot be sent.</p>}
      {canEdit ? (
        <EmailForm
          id={pack.id}
          to={university.applicationEmail ?? ""}
          subject={`Application: ${pack.studentName} – ${pack.courseName}${intake}`}
          message={emailBody(pack, user.name)}
          documents={pack.documents}
          disabled={!ready || !emailEnabled}
        />
      ) : (
        <p className="text-sm text-muted">You can view this page but not send applications.</p>
      )}
    </Card>
  );

  const portalCard = (
    <Card tone="solid" className="print:hidden">
      <h2 className="mb-1 flex items-center gap-1 text-xl font-bold">
        {method === "UCAS" ? "Submit through UCAS" : "Submit on the portal"}
        <InfoTip text="Open the portal in a new tab, then paste each value from the student's details below with its Copy button. Download all documents in one ZIP to upload them. When it is done, record it here." />
      </h2>
      <ol className="mb-4 mt-2 grid list-decimal gap-1 pl-5 text-sm">
        <li>Open the {method === "UCAS" ? "UCAS" : "portal"} in a new tab.</li>
        <li>Fill each field using the Copy buttons under Student details.</li>
        <li>Upload the documents from the ZIP.</li>
        <li>Record the submission below with the applicant ID the university gives.</li>
      </ol>
      <div className="mb-5 flex flex-wrap gap-2">
        {university.applicationUrl && (
          <a href={university.applicationUrl} target="_blank" rel="noopener noreferrer" className={buttonStyles({ size: "sm" })}>
            Open {method === "UCAS" ? "UCAS" : "portal"} ↗
          </a>
        )}
        {privateStorageEnabled && pack.documents.length > 0 && (
          <a href={`/api/applications/${pack.id}/documents`} className={buttonStyles({ size: "sm", variant: "glass" })}>
            Download all documents (ZIP)
          </a>
        )}
      </div>
      {canEdit && <RecordCard pack={pack} methods={methods} disabled={submitted || !ready} submitted={submitted} />}
    </Card>
  );

  const emailFirst = method === "EMAIL";

  return (
    <>
      <Link href={`/dashboard/applications/${pack.id}`} className="text-sm font-medium text-brand-700 hover:underline print:hidden">
        ← Back to the application
      </Link>
      <div className="mt-2">
        <h1 className="text-3xl font-bold">Submit: {pack.studentName}</h1>
        <p className="text-muted">
          {pack.courseName}, {university.name}{intake}
          {method && <> · Takes applications via <span className="font-semibold text-ink">{applicationMethodLabels[method]}</span></>}
        </p>
      </div>

      <Card tone="solid" className="mt-6 print:hidden">
        <h2 className="mb-3 text-xl font-bold">Ready to submit?</h2>
        {submitted && <p className="mb-3 rounded-xl bg-brand-600/8 px-4 py-2.5 text-sm">This application is already marked as submitted. You can still use the details and documents below.</p>}
        {ready ? (
          <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-800">✓ Everything required is in place.</p>
        ) : (
          <ul className="grid gap-2">
            {pack.blockers.map((b) => (
              <li key={b} className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-800">{b}</li>
            ))}
          </ul>
        )}
        {pack.warnings.length > 0 && (
          <ul className="mt-2 grid gap-2">
            {pack.warnings.map((w) => (
              <li key={w} className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-900">{w}</li>
            ))}
          </ul>
        )}
        {!ready && (
          <p className="mt-3 text-sm">
            Fix these on the <Link href={`/dashboard/students/${pack.studentId}`} className="text-brand-700 hover:underline">student&apos;s page</Link> or the{" "}
            <Link href={`/dashboard/applications/${pack.id}`} className="text-brand-700 hover:underline">application</Link>.
          </p>
        )}
        {university.processNotes && (
          <div className="mt-4 rounded-xl bg-brand-600/8 px-4 py-3 text-sm">
            <p className="font-semibold">Notes on {university.name}</p>
            <p className="mt-1 whitespace-pre-line">{university.processNotes}</p>
          </div>
        )}
      </Card>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-6">
          {emailFirst ? emailCard : portalCard}
          <details className="glass-solid rounded-3xl p-6 print:hidden">
            <summary className="cursor-pointer font-semibold text-brand-700">{emailFirst ? "Submitted another way instead?" : "Send by email instead"}</summary>
            <div className="mt-4">{emailFirst ? portalCard : emailCard}</div>
          </details>
        </div>

        <Card tone="solid" className="print:col-span-2 print:p-0 print:shadow-none">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-1 text-xl font-bold">Student details <InfoTip text="Everything from the student's file in the order portal forms usually ask for it. Copy one value at a time, copy everything as text, or print it as a summary to attach." /></h2>
            <div className="flex flex-wrap gap-2 print:hidden">
              <CopyAllButton value={packText(pack)} />
              <PrintButton />
            </div>
          </div>
          <div className="grid gap-5">
            {pack.groups.map((g) => (
              <section key={g.title}>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-brand-800">{g.title}</h3>
                <div className="grid gap-1.5">
                  {g.fields.map((f) => <CopyField key={f.label} label={f.label} value={f.value} />)}
                </div>
              </section>
            ))}
            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-brand-800">Documents</h3>
              {pack.documents.length === 0 && <p className="text-sm text-muted">No approved documents yet.</p>}
              <ul className="grid gap-1.5">
                {pack.documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-brand-900/10 px-3 py-2 text-sm">
                    <span className="min-w-0 break-words">{d.fileName}</span>
                    {privateStorageEnabled && <a href={`/api/documents/${d.id}`} className="shrink-0 font-semibold text-brand-700 hover:underline print:hidden">Download</a>}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </Card>
      </div>
    </>
  );
}

function RecordCard({ pack, methods, disabled, submitted }: { pack: SubmissionPack; methods: { value: string; label: string }[]; disabled: boolean; submitted: boolean }) {
  return (
    <div className="border-t border-brand-900/10 pt-4">
      <h3 className="mb-3 font-bold">Record the submission</h3>
      {submitted ? (
        <p className="text-sm text-muted">Already recorded as submitted.</p>
      ) : (
        <RecordForm id={pack.id} methods={methods} method={pack.university.applicationMethod ?? ""} reference={pack.universityRef ?? ""} disabled={disabled} />
      )}
    </div>
  );
}
