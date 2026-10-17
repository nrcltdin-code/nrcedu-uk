import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Privacy policy" };

// Placeholder wording until the client's own policy (checked against UK GDPR) is supplied.
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="17 October 2026"
      sections={[
        {
          heading: "Who we are",
          body: <p>NRC Educational Consultants Ltd is responsible for the personal information you give us through this website.</p>,
        },
        {
          heading: "What we collect",
          body: <p>Your name, email, phone number and the details and documents you add to your profile and applications, such as education history, test scores and passport details. We also keep a record of the devices you sign in from.</p>,
        },
        {
          heading: "Signing in with Google",
          body: <p>If you choose to sign in with Google, Google shares your name, email address and profile picture with us. We use them only to create and sign in to your account. We do not get your Google password, and we do not see your contacts, emails, files or any other Google data. You can remove our access at any time from your Google account settings.</p>,
        },
        {
          heading: "Cookies",
          body: <p>We use only the cookies needed to keep you signed in and to keep your account secure. We do not use advertising or tracking cookies.</p>,
        },
        {
          heading: "Why we use it",
          body: <p>To advise you, prepare and submit your applications to universities you choose, help with visas, and contact you about your applications.</p>,
        },
        {
          heading: "Who we share it with",
          body: <p>The universities you apply to, and the agent who referred you if you came through one. We also use trusted service providers to host the website, store your documents securely and send emails; they handle your information only on our behalf. We do not sell your information or use it for advertising.</p>,
        },
        {
          heading: "How long we keep it",
          body: <p>While your account is open and for as long afterwards as the law requires. Closing your account deletes your profile and uploaded documents.</p>,
        },
        {
          heading: "Your rights",
          body: <p>You can see and correct most of your details on your profile, and ask us for a copy of your information or for it to be deleted, through the contact page.</p>,
        },
      ]}
    />
  );
}
