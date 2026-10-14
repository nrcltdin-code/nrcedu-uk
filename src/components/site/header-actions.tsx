import Link from "next/link";
import { AuthTrigger } from "@/components/auth/auth-drawer";
import { buttonStyles } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";

// Shown to visitors, and as the instant placeholder while the session is being read.
export function GuestActions() {
  return (
    <>
      <AuthTrigger mode="login" className={buttonStyles({ variant: "ghost", size: "sm" })}>
        Sign in
      </AuthTrigger>
      <Link href="/consultation" className={buttonStyles({ variant: "accent", size: "sm" })}>
        Free consultation
      </Link>
    </>
  );
}

// Reads the session, so it must be rendered inside <Suspense>.
export async function HeaderActions() {
  const user = await getCurrentUser();
  if (!user) return <GuestActions />;

  return (
    <Link href="/dashboard" className={buttonStyles({ size: "sm" })}>
      Dashboard
    </Link>
  );
}
