import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DocumentUpload } from "@/components/dashboard/document-upload";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoTip } from "@/components/ui/info-tip";
import { agentDocumentLabels, requiredAgentDocuments } from "@/lib/agent";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { privateStorageEnabled } from "@/lib/storage";
import { deleteVerificationDocument } from "./actions";
import { OnboardingProfileForm, SubmitForReview } from "./onboarding-forms";

export const metadata: Metadata = { title: "Agent verification", robots: { index: false } };

const docLabels = { PENDING: "Being checked", APPROVED: "Approved", REJECTED: "Please upload again" } as const;
const docTones = { PENDING: "accent", APPROVED: "success", REJECTED: "danger" } as const;

export default function OnboardingPage() {
  return (
    <>
      <PageHeader title="Get verified" description="Before you can add students, NRC checks who you are. Complete your profile, upload the documents below and send them for review." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <Onboarding />
      </Suspense>
    </>
  );
}

async function Onboarding() {
  const user = await requireRole("AGENT");
  const profile = await db.agentProfile.findUnique({
    where: { userId: user.id },
    include: {
      user: { select: { name: true, phone: true } },
      verification: { orderBy: { createdAt: "desc" }, include: { reviewedBy: { select: { name: true } } } },
    },
  });
  if (!profile || profile.approvalStatus === "APPROVED") redirect("/dashboard");

  if (profile.approvalStatus === "REJECTED") {
    return (
      <Card tone="solid" className="max-w-2xl">
        <h2 className="text-xl font-bold">We could not approve your account</h2>
        {profile.reviewNote && <p className="mt-2">{profile.reviewNote}</p>}
        <p className="mt-2 text-muted">If you have questions, reply to our email or contact us.</p>
      </Card>
    );
  }

  const countries = await db.country.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const required = requiredAgentDocuments(profile.kind);
  const has = (type: string) => profile.verification.some((d) => d.type === type && d.status !== "REJECTED");
  const waiting = profile.approvalStatus === "PENDING" && profile.submittedAt;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid gap-6">
        {profile.approvalStatus === "CHANGES_REQUESTED" && (
          <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-950">
            <span className="font-semibold">NRC asked for changes: </span>{profile.reviewNote ?? "see the notes on your documents."} Fix them, then send for review again.
          </p>
        )}
        {waiting && (
          <p role="status" className="rounded-xl border border-brand-600/20 bg-brand-600/8 px-4 py-3">
            Sent for review on {formatDate(profile.submittedAt!)}. We usually reply within 2 working days. You can still update anything below.
          </p>
        )}

        <Card tone="solid">
          <h2 className="mb-4 flex items-center gap-1 text-xl font-bold">1. Your profile <InfoTip text="Tell us who you are and how you work. Choose Agency if you have staff: once approved, you can add your team and decide what each person can do." /></h2>
          <OnboardingProfileForm
            countries={countries}
            profile={{
              kind: profile.kind,
              name: profile.user.name,
              phone: profile.phone ?? profile.user.phone ?? "",
              companyName: profile.companyName ?? "",
              registrationNumber: profile.registrationNumber ?? "",
              website: profile.website ?? "",
              countryId: profile.countryId ?? "",
              address: profile.address ?? "",
              about: profile.about ?? "",
              yearsActive: profile.yearsActive?.toString() ?? "",
              studentsPerYear: profile.studentsPerYear?.toString() ?? "",
            }}
          />
        </Card>

        <Card tone="solid">
          <h2 className="mb-4 flex items-center gap-1 text-xl font-bold">2. Verification documents <InfoTip text="Clear scans or photos (PDF, JPG or PNG, up to 10 MB). Only NRC staff see them. You can remove a file until it is approved." /></h2>
          <ul className="divide-y divide-brand-900/10">
            {profile.verification.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="font-semibold">{agentDocumentLabels[doc.type]}</p>
                  <p className="truncate text-sm text-muted">{doc.name} · {formatDate(doc.createdAt)}</p>
                  {doc.status === "REJECTED" && doc.reviewNote && <p className="mt-1 text-sm text-red-800">NRC says: {doc.reviewNote}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={docTones[doc.status]}>{docLabels[doc.status]}</Badge>
                  <a href={`/api/agent-documents/${doc.id}`} className={buttonStyles({ variant: "glass", size: "sm" })}>Download</a>
                  {doc.status !== "APPROVED" && <DeleteButton action={deleteVerificationDocument.bind(null, doc.id)} question={`Remove ${doc.name}?`} />}
                </div>
              </li>
            ))}
            {profile.verification.length === 0 && <li className="py-2 text-muted">Nothing uploaded yet.</li>}
          </ul>
          <div className="mt-4 border-t border-brand-900/10 pt-4">
            <DocumentUpload
              studentId={profile.id}
              api="/api/agent-documents"
              enabled={privateStorageEnabled}
              types={Object.entries(agentDocumentLabels).map(([value, label]) => ({ value, label }))}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:sticky lg:top-6">
        <Card tone="solid">
          <h2 className="mb-3 flex items-center gap-1 text-lg font-bold">Needed for {profile.kind === "AGENCY" ? "an agency" : "an individual agent"} <InfoTip text="These must be uploaded before you can send your profile for review. Extra documents (office photo, references) help us approve you faster." /></h2>
          <ul className="grid gap-2 text-sm">
            {required.map((type) => (
              <li key={type} className="flex items-center gap-2">
                <span aria-hidden className={has(type) ? "text-emerald-600" : "text-muted"}>{has(type) ? "✓" : "○"}</span>
                <span className={has(type) ? "" : "text-muted"}>{agentDocumentLabels[type]}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card tone="solid">
          <h2 className="mb-3 flex items-center gap-1 text-lg font-bold">3. Send for review <InfoTip text="NRC checks your profile and documents, then approves your account or tells you what to change. You get an email either way." /></h2>
          <SubmitForReview again={Boolean(profile.submittedAt)} />
        </Card>
      </div>
    </div>
  );
}
