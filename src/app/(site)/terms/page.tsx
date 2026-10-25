import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms of use",
  path: "/terms",
});

// Placeholder wording until the client's own terms (checked by their solicitor) are supplied.
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      updated="16 October 2026"
      sections={[
        {
          heading: "About these terms",
          body: <p>These terms apply when you use this website or create an account with NRC Educational Consultant (&quot;NRC&quot;, &quot;we&quot;). By creating an account you agree to them.</p>,
        },
        {
          heading: "Your account",
          body: (
            <>
              <p>Give us accurate details and keep them up to date. Universities rely on the information and documents you provide.</p>
              <p>Keep your password private. You are responsible for what happens under your account; tell us straight away if you think someone else has used it.</p>
            </>
          ),
        },
        {
          heading: "Our service",
          body: <p>We advise on and help with university applications and student visas. Admission and visa decisions are made by universities and governments, not by NRC, so we cannot guarantee an outcome.</p>,
        },
        {
          heading: "Acceptable use",
          body: <p>Do not upload false or someone else&apos;s documents, try to access accounts that are not yours, or interfere with the website. We may suspend accounts that do.</p>,
        },
        {
          heading: "Closing your account",
          body: <p>You can close your account from the Account page while you have no applications in progress, or ask your counsellor at any time.</p>,
        },
        {
          heading: "Contact",
          body: <p>Questions about these terms: use the contact page.</p>,
        },
      ]}
    />
  );
}
