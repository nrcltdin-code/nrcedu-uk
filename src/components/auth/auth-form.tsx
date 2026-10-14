"use client";

import { useState } from "react";
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

  function switchMode(next: AuthMode) {
    setError(null);
    setForgot(false);
    onModeChange(next);
  }

  if (forgot) return <ForgotPassword onBack={() => setForgot(false)} />;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    const { error } =
      mode === "login"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name: String(form.get("name")) });

    setPending(false);
    if (error) {
      // Students whose file NRC started already have an account without a password.
      if (mode !== "login" && error.code?.startsWith("USER_ALREADY_EXISTS")) {
        setError("This email already has an account. Sign in instead, or if NRC started your file for you, ask your counsellor for a link to set your password.");
        return;
      }
      setError(error.message ?? "Something went wrong. Please try again.");
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
            <Input id="auth-name" name="name" autoComplete="name" required />
          </div>
        )}
        <div>
          <Label htmlFor="auth-email">Email</Label>
          <Input id="auth-email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="auth-password">Password</Label>
          <Input
            id="auth-password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={8}
            required
          />
          {mode === "register" && <p className="mt-1.5 text-xs text-muted">At least 8 characters.</p>}
          {mode === "login" && resetEnabled && (
            <button type="button" onClick={() => setForgot(true)} className="mt-1.5 text-xs font-semibold text-brand-700 hover:underline">
              Forgot password?
            </button>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-800">
            {error}
          </p>
        )}

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
          {error && (
            <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-800">
              {error}
            </p>
          )}
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
