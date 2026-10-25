"use client";

import { FileReview } from "@/components/dashboard/decision-form";
import { reviewDocument } from "./document-actions";

export function DocumentReview({ id }: { id: string }) {
  return <FileReview action={reviewDocument} id={id} sendBackLabel="Ask again" notePlaceholder="e.g. Page 2 is missing" />;
}
