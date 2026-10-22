import type { ApplicationStage, DocumentRequestStatus } from "@/generated/prisma/client";

// The application pipeline: stages, the rules for moving between them, and how each event
// in an application's history is described. Plain data, so pages and forms can use it too.
// Only staff move applications; the checks here run on the server for every move.

// Pipeline order. The happy path ends at Enrolled; the last four are the other end states.
export const stages: ApplicationStage[] = [
  "NEW",
  "DOCUMENTS_PENDING",
  "READY_TO_SUBMIT",
  "SUBMITTED_TO_UNIVERSITY",
  "UNIVERSITY_QUERY",
  "CONDITIONAL_OFFER",
  "UNCONDITIONAL_OFFER",
  "OFFER_ACCEPTED",
  "DEPOSIT_PAID",
  "CAS_REQUESTED",
  "CAS_ISSUED",
  "VISA_APPLIED",
  "VISA_GRANTED",
  "ENROLLED",
  "REJECTED",
  "OFFER_DECLINED",
  "VISA_REFUSED",
  "WITHDRAWN",
];

export const closedStages: ApplicationStage[] = ["ENROLLED", "REJECTED", "OFFER_DECLINED", "VISA_REFUSED", "WITHDRAWN"];
export const isClosed = (stage: ApplicationStage) => closedStages.includes(stage);

// Steps a university can mark as not part of its process. The rest always apply.
export const skippableStages: ApplicationStage[] = ["UNIVERSITY_QUERY", "CONDITIONAL_OFFER", "OFFER_ACCEPTED", "DEPOSIT_PAID", "CAS_REQUESTED", "CAS_ISSUED", "VISA_APPLIED", "VISA_GRANTED"];

// Ending stages need a reason; the student sees it.
export const needsReason: ApplicationStage[] = ["UNIVERSITY_QUERY", "REJECTED", "OFFER_DECLINED", "VISA_REFUSED", "WITHDRAWN"];

// The university's own name for its confirmation of enrolment (CAS, I-20, CoE, LOA) replaces "CAS".
export function stageLabel(stage: ApplicationStage, confirmationName = "CAS") {
  return stageLabels[stage].replace("CAS", confirmationName);
}

export const stageLabels: Record<ApplicationStage, string> = {
  NEW: "New",
  DOCUMENTS_PENDING: "Documents pending",
  READY_TO_SUBMIT: "Ready to submit",
  SUBMITTED_TO_UNIVERSITY: "Submitted to university",
  UNIVERSITY_QUERY: "University query",
  CONDITIONAL_OFFER: "Conditional offer",
  UNCONDITIONAL_OFFER: "Unconditional offer",
  OFFER_ACCEPTED: "Offer accepted",
  DEPOSIT_PAID: "Deposit paid",
  CAS_REQUESTED: "CAS requested",
  CAS_ISSUED: "CAS issued",
  VISA_APPLIED: "Visa applied",
  VISA_GRANTED: "Visa granted",
  ENROLLED: "Enrolled",
  REJECTED: "Rejected by university",
  OFFER_DECLINED: "Offer declined",
  VISA_REFUSED: "Visa refused",
  WITHDRAWN: "Withdrawn",
};

export const stageTones: Record<ApplicationStage, "brand" | "accent" | "success" | "danger" | "neutral"> = {
  NEW: "accent",
  DOCUMENTS_PENDING: "accent",
  READY_TO_SUBMIT: "accent",
  SUBMITTED_TO_UNIVERSITY: "brand",
  UNIVERSITY_QUERY: "accent",
  CONDITIONAL_OFFER: "brand",
  UNCONDITIONAL_OFFER: "success",
  OFFER_ACCEPTED: "success",
  DEPOSIT_PAID: "brand",
  CAS_REQUESTED: "brand",
  CAS_ISSUED: "success",
  VISA_APPLIED: "brand",
  VISA_GRANTED: "success",
  ENROLLED: "success",
  REJECTED: "danger",
  OFFER_DECLINED: "neutral",
  VISA_REFUSED: "danger",
  WITHDRAWN: "neutral",
};

// Plain-language "what happens now" for students and agents, per stage.
export const nextStepText: Record<ApplicationStage, string> = {
  NEW: "Your counsellor will review this application and tell you which documents are needed.",
  DOCUMENTS_PENDING: "Upload the documents asked for on the Documents page. Each one opens for upload when it is needed.",
  READY_TO_SUBMIT: "We have what we need. Your counsellor is preparing the application for the university.",
  SUBMITTED_TO_UNIVERSITY: "The university has your application. Decisions usually take 2 to 6 weeks.",
  UNIVERSITY_QUERY: "The university asked for more information. Your counsellor will tell you what is needed.",
  CONDITIONAL_OFFER: "You have a conditional offer. Meet the conditions listed below and send proof to your counsellor.",
  UNCONDITIONAL_OFFER: "You have an unconditional offer. Your counsellor will help you accept it.",
  OFFER_ACCEPTED: "You accepted the offer. Next is the tuition deposit, if the university asks for one.",
  DEPOSIT_PAID: "Deposit received. Next the university issues your CAS.",
  CAS_REQUESTED: "Your CAS has been requested from the university. This usually takes 1 to 3 weeks.",
  CAS_ISSUED: "Your CAS is issued. You can now apply for your student visa.",
  VISA_APPLIED: "Your visa application is with the embassy. Keep your passport ready for collection.",
  VISA_GRANTED: "Visa granted. Book your travel and check the university's arrival and enrolment dates.",
  ENROLLED: "You are enrolled. Good luck with your studies!",
  REJECTED: "The university did not offer you a place. Your counsellor will talk you through other options.",
  OFFER_DECLINED: "This offer was declined.",
  VISA_REFUSED: "Your counsellor will talk you through the refusal and your options.",
  WITHDRAWN: "This application was withdrawn.",
};

// ---- Moving between stages ----

export type MoveFacts = {
  from: ApplicationStage;
  to: ApplicationStage;
  isAdmin: boolean;
  skippedStages: ApplicationStage[];
  note: string;
  // Required document requests not yet approved or waived.
  missingDocuments: number;
  openConditions: number;
  casNumber: string | null;
  confirmationName: string;
};

// The stages a staff member may pick next. Forward to any step that applies, back one step
// at a time to correct a mistake, or to any end state. Closed applications only an admin reopens.
export function allowedMoves(from: ApplicationStage, skipped: ApplicationStage[], isAdmin: boolean): ApplicationStage[] {
  if (isClosed(from)) return isAdmin ? stages.filter((s) => s !== from && !isClosed(s) && !skipped.includes(s)) : [];
  const at = stages.indexOf(from);
  return stages.filter((stage, i) => {
    if (stage === from || skipped.includes(stage)) return false;
    if (isClosed(stage)) return true;
    return i > at || i === at - 1 || stage === "DOCUMENTS_PENDING";
  });
}

// Why a move is refused, or null when it is fine.
export function moveProblem(f: MoveFacts): string | null {
  if (!allowedMoves(f.from, f.skippedStages, f.isAdmin).includes(f.to)) {
    return isClosed(f.from) ? "This application is closed. Only an administrator can reopen it." : "That stage cannot be chosen from here.";
  }
  if (needsReason.includes(f.to) && f.note.length < 3) return "Add a note saying why. The student sees it.";
  const at = stages.indexOf(f.to);
  if (at >= stages.indexOf("SUBMITTED_TO_UNIVERSITY") && !isClosed(f.to) && f.missingDocuments > 0) {
    return `${f.missingDocuments} required document${f.missingDocuments === 1 ? " is" : "s are"} not approved yet. Approve or waive ${f.missingDocuments === 1 ? "it" : "them"} first.`;
  }
  if (at >= stages.indexOf("UNCONDITIONAL_OFFER") && !isClosed(f.to) && f.openConditions > 0) {
    return `${f.openConditions} offer condition${f.openConditions === 1 ? " is" : "s are"} not met yet. Tick them off first.`;
  }
  if (at >= stages.indexOf("CAS_ISSUED") && !isClosed(f.to) && !f.casNumber) {
    return `Save the ${f.confirmationName} number under Key details first.`;
  }
  return null;
}

// ---- Document requests ----

export const requestStatusLabels: Record<DocumentRequestStatus, string> = {
  REQUESTED: "Waiting for upload",
  UPLOADED: "Uploaded, being checked",
  APPROVED: "Approved",
  NEEDS_REUPLOAD: "Please upload again",
  WAIVED: "Not needed",
};

export const requestStatusTones: Record<DocumentRequestStatus, "brand" | "accent" | "success" | "danger" | "neutral"> = {
  REQUESTED: "accent",
  UPLOADED: "brand",
  APPROVED: "success",
  NEEDS_REUPLOAD: "danger",
  WAIVED: "neutral",
};

// A student may upload into a request only while staff keep it open and it still needs a file.
export const acceptsUpload = (request: { isOpen: boolean; status: DocumentRequestStatus }) =>
  request.isOpen && (request.status === "REQUESTED" || request.status === "NEEDS_REUPLOAD" || request.status === "UPLOADED");

// ---- History ----

export const eventText: Record<string, string> = {
  created: "Application started",
  stage: "Stage changed",
  "request.created": "Document requested",
  "request.opened": "Upload opened",
  "request.closed": "Upload closed",
  "request.waived": "Document marked not needed",
  "request.deleted": "Document request removed",
  "document.uploaded": "Document uploaded",
  "document.approved": "Document approved",
  "document.rejected": "Document sent back",
  "document.deleted": "Document removed",
  "condition.added": "Offer condition added",
  "condition.met": "Offer condition met",
  "condition.unmet": "Offer condition reopened",
  "condition.deleted": "Offer condition removed",
  "details.updated": "Key details updated",
  "assigned": "Counsellor changed",
  "whatsapp": "WhatsApp chat opened",
  note: "Note added",
  "submission.emailed": "Application emailed to the university",
};
