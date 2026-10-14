import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/site/page-hero";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

// The emailed link goes through /api/auth/reset-password/<token>, which sends people here with
// ?token=… when it is valid, or ?error=INVALID_TOKEN when it has expired or was used.
export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <main>
      <PageHero eyebrow="Account" title="Choose a new" highlight="password">
        Pick a new password for your NRC account.
      </PageHero>
      <Section>
        <Card className="mx-auto max-w-md p-6 sm:p-8">
          <Suspense fallback={<p>Checking your link…</p>}>
            <ResetForm searchParams={searchParams} />
          </Suspense>
        </Card>
      </Section>
    </main>
  );
}

async function ResetForm({ searchParams }: Pick<PageProps<"/reset-password">, "searchParams">) {
  const { token, error } = await searchParams;
  if (error || typeof token !== "string" || !token) {
    return <p>This link has expired or was already used. Open “Sign in”, choose “Forgot password?” and ask for a new one.</p>;
  }
  return <ResetPasswordForm token={token} />;
}
