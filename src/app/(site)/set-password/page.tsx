import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/site/page-hero";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { db } from "@/lib/db";
import { checkInvite } from "@/lib/invites";
import { SetPasswordForm } from "./set-password-form";

export const metadata: Metadata = { title: "Set your password", robots: { index: false } };

export default function SetPasswordPage({ searchParams }: PageProps<"/set-password">) {
  return (
    <main>
      <PageHero eyebrow="Student portal" title="Set your" highlight="password">
        Choose a password to sign in and follow your applications.
      </PageHero>
      <Section>
        <Card className="mx-auto max-w-md p-6 sm:p-8">
          <Suspense fallback={<p>Checking your link…</p>}>
            <InviteForm searchParams={searchParams} />
          </Suspense>
        </Card>
      </Section>
    </main>
  );
}

async function InviteForm({ searchParams }: Pick<PageProps<"/set-password">, "searchParams">) {
  const { invite } = await searchParams;
  const token = typeof invite === "string" ? invite : "";
  const userId = token ? await checkInvite(token) : null;
  const user = userId ? await db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }) : null;

  if (!user) {
    return <p>This link has expired or was already used. Ask your counsellor to send you a new one.</p>;
  }
  return (
    <>
      <p className="mb-5">
        Hello {user.name.split(" ")[0]}. Your account is <span className="font-semibold">{user.email}</span>.
      </p>
      <SetPasswordForm invite={token} email={user.email} />
    </>
  );
}
