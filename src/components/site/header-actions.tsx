import Link from "next/link";
import { AuthTrigger } from "@/components/auth/auth-drawer";
import { buttonStyles } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { getSignedInUser } from "@/lib/session";

const itemClass = "block w-full rounded-xl px-3 py-2.5 text-left hover:bg-brand-600/10";

// "Apply" dropdown: students find a course (signing up first if needed); agents register.
// A <details> menu, so it works without JavaScript.
export function ApplyMenu({ signedIn }: { signedIn: boolean }) {
  const student = (
    <>
      <span className="block text-sm font-semibold text-brand-900">As a student</span>
      <span className="block text-xs text-muted">Find a course and apply, free</span>
    </>
  );
  return (
    <details className="group relative">
      <summary className={buttonStyles({ variant: "glass", size: "sm", className: "cursor-pointer list-none gap-1 whitespace-nowrap [&::-webkit-details-marker]:hidden" })}>
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

// The two buttons at the end of the main bar. Shown to visitors, and as the placeholder while
// the session is read.
export function GuestActions() {
  return (
    <>
      <ApplyMenu signedIn={false} />
      <Link href="/consultation" className={buttonStyles({ variant: "accent", size: "sm", className: "whitespace-nowrap" })}>
        Free consultation
      </Link>
    </>
  );
}

// Reads the session, so it must be rendered inside <Suspense>.
export async function HeaderActions() {
  const user = await getSignedInUser();
  if (!user) return <GuestActions />;
  return (
    <>
      {user.role === "STUDENT" && <ApplyMenu signedIn />}
      <Link href="/dashboard" className={buttonStyles({ size: "sm", className: "whitespace-nowrap" })}>
        Dashboard
      </Link>
    </>
  );
}

// Sign in (or the signed-in name) in the top bar.
export function GuestAccount() {
  return (
    <AuthTrigger mode="login" className="inline-flex items-center gap-1.5 font-semibold text-brand-800 hover:text-brand-600">
      <Icon name="users" className="size-3.5" />
      Sign in
    </AuthTrigger>
  );
}

export async function HeaderAccount() {
  const user = await getSignedInUser();
  if (!user) return <GuestAccount />;
  // A small pill: initial in a coloured circle, the first name, and a green "signed in" dot.
  return (
    <Link
      href="/dashboard"
      title="Signed in. Open your dashboard"
      className="inline-flex items-center gap-2 rounded-full border border-brand-600/20 bg-white/80 py-0.5 pl-0.5 pr-3 font-semibold text-brand-900 shadow-sm transition hover:border-brand-600/40 hover:bg-white"
    >
      <span className="relative flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-[0.7rem] font-bold uppercase text-white">
        {user.name.charAt(0)}
        <span aria-hidden className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
      </span>
      {user.name.split(" ")[0]}
    </Link>
  );
}
