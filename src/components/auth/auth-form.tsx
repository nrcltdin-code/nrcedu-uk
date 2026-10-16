"use client";

import Link from "next/link";
import { useState } from "react";
import { PasswordInput, PasswordStrength } from "@/components/auth/password-field";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

export type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSuccess: () => void;
  // Where Google sends the person back to after signing in.
  callbackURL: string;
  googleEnabled: boolean;
  // "Forgot password" needs email to be set up.
  resetEnabled: boolean;
};

export function AuthForm({ mode, onModeChange, onSuccess, callbackURL, googleEnabled, resetEnabled }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [forgot, setForgot] = useState(false);
  // Set after a correct password when the account has two-step sign-in on.
  const [twoFactor, setTwoFactor] = useState(false);
  const [password, setPassword] = useState("");
  // Address the confirmation link went to, after signing up or a refused sign-in.
  const [checkInbox, setCheckInbox] = useState<string | null>(null);

  function switchMode(next: AuthMode) {
    setError(null);
    setForgot(false);
    setPassword("");
    onModeChange(next);
  }

  if (forgot) return <ForgotPassword onBack={() => setForgot(false)} />;
  if (twoFactor) return <TwoFactorStep onSuccess={onSuccess} onBack={() => setTwoFactor(false)} />;
  if (checkInbox) {
    return (
      <div className="grid gap-4">
        <p role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900">
          We sent a confirmation link to <strong>{checkInbox}</strong>. Open it to confirm your email; it signs you in. Check your spam folder if it has not arrived in a few minutes.
        </p>
        <button type="button" onClick={() => { setCheckInbox(null); switchMode("login"); }} className="justify-self-center text-sm font-semibold text-brand-700 hover:underline">
          Back to sign in
        </button>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));

    if (mode === "register" && password !== String(form.get("confirm"))) {
      setPending(false);
      setError("The two passwords do not match.");
      return;
    }

    const phone = String(form.get("phone") ?? "").trim();
    const { data, error } =
      mode === "login"
        ? await authClient.signIn.email({ email, password, callbackURL })
        : await authClient.signUp.email({ email, password, name: String(form.get("name")).trim(), phone: phone || undefined, callbackURL });

    setPending(false);
    if (error) {
      // Students whose file NRC started already have an account without a password.
      if (mode !== "login" && error.code?.startsWith("USER_ALREADY_EXISTS")) {
        setError("This email already has an account. Sign in instead, or if NRC started your file for you, ask your counsellor for a link to set your password.");
        return;
      }
      // Unconfirmed address: Better Auth has just emailed a fresh link.
      if (error.code === "EMAIL_NOT_VERIFIED") {
        setCheckInbox(email);
        return;
      }
      setError(error.message ?? "Something went wrong. Please try again.");
      return;
    }
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
      setTwoFactor(true);
      return;
    }
    // Signed up, but no session until the address is confirmed.
    if (mode === "register" && data && "token" in data && !data.token) {
      setCheckInbox(email);
      return;
    }
    onSuccess();
  }

  async function onGoogle() {
    setError(null);
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL });
    if (error) setError(error.message ?? "Google sign-in failed. Please try again.");
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-brand-900/8 p-1 text-sm font-semibold">
        {(["login", "register"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => switchMode(tab)}
            aria-pressed={mode === tab}
            className={
              mode === tab
                ? "rounded-full bg-white py-2 text-brand-800 shadow-sm"
                : "rounded-full py-2 text-muted hover:text-ink"
            }
          >
            {tab === "login" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>

      {googleEnabled && (
        <>
          <Button type="button" variant="glass" className="w-full" onClick={onGoogle}>
            <GoogleIcon />
            Continue with Google
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-brand-900/15" />
            or
            <span className="h-px flex-1 bg-brand-900/15" />
          </div>
        </>
      )}

      {/* key resets the fields when switching between sign in and sign up */}
      <form key={mode} onSubmit={onSubmit} className="grid gap-4">
        {mode === "register" && (
          <div>
            <Label htmlFor="auth-name">Full name</Label>
            <Input id="auth-name" name="name" autoComplete="name" maxLength={100} required />
          </div>
        )}
        <div>
          <Label htmlFor="auth-email">Email</Label>
          <Input id="auth-email" name="email" type="email" autoComplete="email" required />
        </div>
        {mode === "register" && (
          <div>
            <Label htmlFor="auth-phone">
              Phone or WhatsApp <span className="font-normal text-muted">(optional)</span>
            </Label>
            <Input id="auth-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} placeholder="+44 7700 900123" />
          </div>
        )}
        <div>
          <Label htmlFor="auth-password">Password</Label>
          <PasswordInput
            id="auth-password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={8}
            maxLength={128}
            required
          />
          {mode === "register" && <PasswordStrength password={password} />}
          {mode === "login" && resetEnabled && (
            <button type="button" onClick={() => setForgot(true)} className="mt-1.5 text-xs font-semibold text-brand-700 hover:underline">
              Forgot password?
            </button>
          )}
        </div>

        {mode === "register" && (
          <>
            <div>
              <Label htmlFor="auth-confirm">Confirm password</Label>
              <PasswordInput id="auth-confirm" name="confirm" autoComplete="new-password" minLength={8} maxLength={128} required />
            </div>
            <label className="flex items-start gap-2.5 text-sm text-muted">
              <input type="checkbox" name="terms" required className="mt-0.5 size-4 shrink-0 accent-brand-600" />
              <span>
                I agree to the{" "}
                <Link href="/terms" target="_blank" className="font-semibold text-brand-700 hover:underline">terms of use</Link>
                {" "}and{" "}
                <Link href="/privacy" target="_blank" className="font-semibold text-brand-700 hover:underline">privacy policy</Link>.
              </span>
            </label>
          </>
        )}

        <ErrorMessage error={error} />

        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {mode === "login" ? "New here? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => switchMode(mode === "login" ? "register" : "login")}
          className="font-semibold text-brand-700 hover:underline"
        >
          {mode === "login" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<"idle" | "pending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setState("pending");
    const email = String(new FormData(event.currentTarget).get("email"));
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    if (error) {
      setError(error.message ?? "Something went wrong. Please try again.");
      setState("idle");
      return;
    }
    setState("sent");
  }

  return (
    <div className="grid gap-4">
      {state === "sent" ? (
        // Same answer whether or not the account exists, so the form cannot reveal who is registered.
        <p role="status">If an account uses that email, we have sent it a link to choose a new password. Check your inbox (and spam folder); the link works for one hour.</p>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-4">
          <p className="text-sm text-muted">Enter your email and we will send you a link to choose a new password.</p>
          <div>
            <Label htmlFor="forgot-email">Email</Label>
            <Input id="forgot-email" name="email" type="email" autoComplete="email" required />
          </div>
          <ErrorMessage error={error} />
          <Button type="submit" variant="accent" disabled={state === "pending"}>
            {state === "pending" ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
      <button type="button" onClick={onBack} className="justify-self-center text-sm font-semibold text-brand-700 hover:underline">
        Back to sign in
      </button>
    </div>
  );
}

function ErrorMessage({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-800">
      {error}
    </p>
  );
}

// Second step of signing in for accounts with two-step sign-in on: a code from the authenticator
// app, or one of the backup codes. The password step left a 10-minute cookie these calls check.
function TwoFactorStep({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
  const [useBackup, setUseBackup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const code = String(form.get("code")).replace(/\s/g, "");
    const trustDevice = form.get("trust") === "on";
    const { error } = useBackup
      ? await authClient.twoFactor.verifyBackupCode({ code, trustDevice })
      : await authClient.twoFactor.verifyTotp({ code, trustDevice });
    setPending(false);
    if (error) {
      setError(error.message ?? "That code did not work. Please try again.");
      return;
    }
    onSuccess();
  }

  return (
    <div className="grid gap-4">
      <form key={String(useBackup)} onSubmit={onSubmit} className="grid gap-4">
        <p className="text-sm text-muted">
          {useBackup
            ? "Enter one of the backup codes you saved when you turned on two-step sign-in. Each code works once."
            : "Open your authenticator app and enter the 6-digit code for NRC Educational Consultants."}
        </p>
        <div>
          <Label htmlFor="tf-code">{useBackup ? "Backup code" : "6-digit code"}</Label>
          <Input
            id="tf-code"
            name="code"
            autoComplete="one-time-code"
            inputMode={useBackup ? "text" : "numeric"}
            maxLength={useBackup ? 32 : 9}
            autoFocus
            required
            className="text-center font-mono text-lg tracking-[0.3em]"
          />
        </div>
        <label className="flex items-center gap-2.5 text-sm text-muted">
          <input type="checkbox" name="trust" className="size-4 accent-brand-600" />
          Trust this device for 30 days
        </label>
        <ErrorMessage error={error} />
        <Button type="submit" variant="accent" disabled={pending}>{pending ? "Checking…" : "Verify and sign in"}</Button>
      </form>
      <button type="button" onClick={() => { setError(null); setUseBackup(!useBackup); }} className="justify-self-center text-sm font-semibold text-brand-700 hover:underline">
        {useBackup ? "Use the authenticator app instead" : "Lost your phone? Use a backup code"}
      </button>
      <button type="button" onClick={onBack} className="justify-self-center text-sm text-muted hover:underline">
        Back to sign in
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
