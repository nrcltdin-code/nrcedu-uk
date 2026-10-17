import Link from "next/link";
import { AuthTrigger } from "@/components/auth/auth-drawer";
import { buttonStyles } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { getCurrentUser } from "@/lib/session";

const itemClass = "block w-full rounded-xl px-3 py-2.5 text-left hover:bg-brand-600/10";

// "Apply" dropdown: students find a course (signing up first if needed); agents register.
// A <details> menu, so it works without JavaScript and closes when an item is chosen.
export function ApplyMenu({ signedIn }: { signedIn: boolean }) {
  const student = (
    <>
      <span className="block text-sm font-semibold text-brand-900">As a student</span>
      <span className="block text-xs text-muted">Find a course and apply, free</span>
    </>
  );
  return (
    <details className="group relative">
      <summary className={buttonStyles({ variant: "glass", size: "sm", className: "cursor-pointer list-none gap-1 [&::-webkit-details-marker]:hidden" })}>
        Apply
        <Icon name="chevron" className="size-4 rotate-90 transition-transform group-open:-rotate-90" />
      </summary>
      <div className="glass-solid absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl p-2 shadow-lg">
        {signedIn ? (
          <Link href="/universities" className={itemClass}>{student}</Link>
        ) : (
          <AuthTrigger mode="register" next="/universities" className={itemClass}>{student}</AuthTrigger>
        )}
        <Link href="/become-an-agent" className={itemClass}>
          <span className="block text-sm font-semibold text-brand-900">As an agent</span>
          <span className="block text-xs text-muted">Register yourself or your agency</span>
        </Link>
      </div>
    </details>
  );
}

// Shown to visitors, and as the instant placeholder while the session is being read.
export function GuestActions() {
  return (
    <>
      <ApplyMenu signedIn={false} />
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
    <>
      {user.role !== "AGENT" && user.role !== "ADMIN" && user.role !== "STAFF" && <ApplyMenu signedIn />}
      <Link href="/dashboard" className={buttonStyles({ size: "sm" })}>
        Dashboard
      </Link>
    </>
  );
}
