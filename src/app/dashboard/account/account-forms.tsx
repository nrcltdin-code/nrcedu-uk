"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { PasswordInput, PasswordStrength } from "@/components/auth/password-field";
import { FormMessage } from "@/components/dashboard/form-bits";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { authClient } from "@/lib/auth-client";
import type { FormState } from "@/lib/form";
import { saveAccountDetails } from "./actions";

function Alert({ tone = "error", children }: { tone?: "error" | "success"; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-800"
          : "rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-800"
      }
    >
      {children}
    </p>
  );
}

const field = (form: FormData, key: string) => String(form.get(key) ?? "");

export function DetailsForm({ name, phone }: { name: string; phone: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveAccountDetails, {});
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="a-name">Full name</Label>
          <Input id="a-name" name="name" defaultValue={name} maxLength={100} required autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="a-phone">Phone or WhatsApp</Label>
          <Input id="a-phone" name="phone" type="tel" defaultValue={phone ?? ""} maxLength={30} autoComplete="tel" />
        </div>
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Save details"}</Button>
    </form>
  );
}

export function EmailForm({ email, verified, emailEnabled }: { email: string; verified: boolean; emailEnabled: boolean }) {
  const [state, setState] = useState<{ pending?: boolean; error?: string; sent?: string }>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newEmail = field(new FormData(event.currentTarget), "email").trim().toLowerCase();
    setState({ pending: true });
    const { error } = await authClient.changeEmail({ newEmail, callbackURL: "/dashboard/account" });
    setState(error ? { error: error.message ?? "Could not change your email." } : { sent: newEmail });
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm">
        <span className="text-muted">Current email: </span>
        <strong>{email}</strong>{" "}
        {verified
          ? <span className="ml-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-xs font-semibold text-emerald-800">Confirmed</span>
          : <span className="ml-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-900">Not confirmed</span>}
      </p>
      {!emailEnabled ? (
        <p className="text-sm text-muted">Changing your email needs email sending, which is switched off. Ask an admin to change it for you.</p>
      ) : state.sent ? (
        <Alert tone="success">
          {verified
            ? <>We emailed <strong>{email}</strong> to approve the change. After that, confirm the link we send to <strong>{state.sent}</strong>.</>
            : <>Your email is now <strong>{state.sent}</strong>. Check that inbox for a link to confirm it.</>}
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-4">
          <div>
            <Label htmlFor="a-new-email">New email</Label>
            <Input id="a-new-email" name="email" type="email" autoComplete="email" required />
          </div>
          <Alert>{state.error}</Alert>
          <Button type="submit" variant="glass" disabled={state.pending} className="justify-self-start">
            {state.pending ? "Sending…" : "Change email"}
          </Button>
        </form>
      )}
    </div>
  );
}

export function PasswordForm({ hasPassword, email, emailEnabled }: { hasPassword: boolean; email: string; emailEnabled: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [state, setState] = useState<{ pending?: boolean; error?: string; done?: boolean }>({});

  // Google-only accounts have no password yet: the reset email lets them choose one.
  if (!hasPassword) {
    async function sendLink() {
      setState({ pending: true });
      const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
      setState(error ? { error: error.message ?? "Could not send the email." } : { done: true });
    }
    return (
      <div className="grid gap-4">
        <p className="text-sm text-muted">You sign in with Google, so this account has no password. Add one to also sign in with your email.</p>
        {state.done ? (
          <Alert tone="success">We sent a link to {email}. Open it to choose your password.</Alert>
        ) : emailEnabled ? (
          <>
            <Alert>{state.error}</Alert>
            <Button type="button" variant="glass" onClick={sendLink} disabled={state.pending} className="justify-self-start">
              {state.pending ? "Sending…" : "Email me a link to add a password"}
            </Button>
          </>
        ) : null}
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (password !== field(form, "confirm")) {
      setState({ error: "The two new passwords do not match." });
      return;
    }
    setState({ pending: true });
    const { error } = await authClient.changePassword({
      currentPassword: field(form, "current"),
      newPassword: password,
      revokeOtherSessions: true,
    });
    if (error) {
      setState({ error: error.code === "INVALID_PASSWORD" ? "Your current password is not right." : error.message ?? "Could not change your password." });
      return;
    }
    formElement.reset();
    setPassword("");
    setState({ done: true });
    toast("Password changed");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div>
        <Label htmlFor="a-current">Current password</Label>
        <PasswordInput id="a-current" name="current" autoComplete="current-password" required />
      </div>
      <div>
        <Label htmlFor="a-new">New password</Label>
        <PasswordInput id="a-new" name="new" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} maxLength={128} required />
        <PasswordStrength password={password} />
      </div>
      <div>
        <Label htmlFor="a-confirm">Confirm new password</Label>
        <PasswordInput id="a-confirm" name="confirm" autoComplete="new-password" minLength={8} maxLength={128} required />
      </div>
      <Alert>{state.error}</Alert>
      {state.done && <Alert tone="success">Password changed. Your other devices have been signed out.</Alert>}
      <Button type="submit" variant="glass" disabled={state.pending} className="justify-self-start">
        {state.pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}

function BackupCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  function download() {
    const text = `NRC Educational Consultants: two-step sign-in backup codes\nEach code works once.\n\n${codes.join("\n")}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "nrc-backup-codes.txt" });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm">
        <strong>Save these backup codes somewhere safe.</strong> If you lose your phone, each one lets you sign in once. They will not be shown again.
      </p>
      <ul className="grid grid-cols-2 gap-2 rounded-2xl bg-brand-900/5 p-4 font-mono text-sm">
        {codes.map((code) => <li key={code}>{code}</li>)}
      </ul>
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="glass" size="sm" onClick={download}>Download</Button>
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={() => navigator.clipboard.writeText(codes.join("\n")).then(() => toast("Codes copied"))}
        >
          Copy
        </Button>
        <Button type="button" size="sm" onClick={onDone}>I have saved them</Button>
      </div>
    </div>
  );
}

type TwoFactorStage =
  | { step: "idle" }
  | { step: "password"; purpose: "enable" | "disable" | "codes" }
  | { step: "scan"; uri: string; codes: string[] }
  | { step: "codes"; codes: string[] };

export function TwoFactorPanel({ enabled, hasPassword, required }: { enabled: boolean; hasPassword: boolean; required: boolean }) {
  const router = useRouter();
  const [stage, setStage] = useState<TwoFactorStage>({ step: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  const uri = stage.step === "scan" ? stage.uri : null;
  useEffect(() => {
    if (uri) QRCode.toDataURL(uri, { width: 200, margin: 1 }).then(setQr, () => setQr(null));
  }, [uri]);

  function start(purpose: "enable" | "disable" | "codes") {
    setError(null);
    setStage({ step: "password", purpose });
  }

  function finish() {
    setStage({ step: "idle" });
    router.refresh();
  }

  if (!hasPassword) {
    return <p className="text-sm text-muted">Two-step sign-in protects password sign-ins. You sign in with Google, so your Google account&apos;s own security settings protect this account.</p>;
  }

  async function onPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (stage.step !== "password") return;
    const password = field(new FormData(event.currentTarget), "password");
    setError(null);
    setPending(true);
    if (stage.purpose === "enable") {
      const { data, error } = await authClient.twoFactor.enable({ password });
      setPending(false);
      if (error || !data || !("totpURI" in data) || !data.totpURI) return setError(error?.message ?? "Could not start set-up.");
      setStage({ step: "scan", uri: data.totpURI, codes: data.backupCodes ?? [] });
    } else if (stage.purpose === "disable") {
      const { error } = await authClient.twoFactor.disable({ password });
      setPending(false);
      if (error) return setError(error.message ?? "Could not turn it off.");
      toast("Two-step sign-in turned off");
      finish();
    } else {
      const { data, error } = await authClient.twoFactor.generateBackupCodes({ password });
      setPending(false);
      if (error || !data) return setError(error?.message ?? "Could not make new codes.");
      setStage({ step: "codes", codes: data.backupCodes });
    }
  }

  async function onVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (stage.step !== "scan") return;
    const code = field(new FormData(event.currentTarget), "code").replace(/\s/g, "");
    setError(null);
    setPending(true);
    const { error } = await authClient.twoFactor.verifyTotp({ code });
    setPending(false);
    if (error) return setError(error.message ?? "That code did not work. Check the time on your phone and try again.");
    toast("Two-step sign-in is on");
    setStage({ step: "codes", codes: stage.codes });
  }

  if (stage.step === "password") {
    const label = stage.purpose === "enable" ? "Continue" : stage.purpose === "disable" ? "Turn off" : "Make new codes";
    return (
      <form onSubmit={onPassword} className="grid gap-4">
        <p className="text-sm text-muted">
          {stage.purpose === "codes" ? "New codes replace your old ones. " : ""}Enter your password to continue.
        </p>
        <div>
          <Label htmlFor="tf-password">Password</Label>
          <PasswordInput id="tf-password" name="password" autoComplete="current-password" autoFocus required />
        </div>
        <Alert>{error}</Alert>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant={stage.purpose === "disable" ? "glass" : "primary"} disabled={pending}>{pending ? "Please wait…" : label}</Button>
          <Button type="button" variant="ghost" onClick={() => setStage({ step: "idle" })}>Cancel</Button>
        </div>
      </form>
    );
  }

  if (stage.step === "scan") {
    const secret = new URL(stage.uri).searchParams.get("secret") ?? "";
    return (
      <form onSubmit={onVerify} className="grid gap-4">
        <ol className="grid list-decimal gap-1 pl-5 text-sm text-muted">
          <li>Install an authenticator app, such as Google Authenticator, Microsoft Authenticator or 1Password.</li>
          <li>Scan this QR code with it, or type in the key below.</li>
          <li>Enter the 6-digit code the app shows.</li>
        </ol>
        <div className="flex flex-wrap items-center gap-5">
          {qr
            // eslint-disable-next-line @next/next/no-img-element -- a generated data URL, nothing to optimise
            ? <img src={qr} alt="QR code for your authenticator app" width={176} height={176} className="rounded-xl bg-white p-2" />
            : <div className="size-44 rounded-xl bg-brand-900/5" />}
          <div className="min-w-0 text-sm">
            <p className="text-muted">Set-up key</p>
            <p className="break-all font-mono font-semibold">{secret.match(/.{1,4}/g)?.join(" ")}</p>
          </div>
        </div>
        <div className="max-w-xs">
          <Label htmlFor="tf-verify">6-digit code</Label>
          <Input id="tf-verify" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={9} required className="text-center font-mono text-lg tracking-[0.3em]" />
        </div>
        <Alert>{error}</Alert>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>{pending ? "Checking…" : "Turn on"}</Button>
          <Button type="button" variant="ghost" onClick={() => setStage({ step: "idle" })}>Cancel</Button>
        </div>
      </form>
    );
  }

  if (stage.step === "codes") return <BackupCodes codes={stage.codes} onDone={finish} />;

  return (
    <div className="grid gap-4">
      <p className="text-sm">
        Status:{" "}
        {enabled
          ? <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-xs font-semibold text-emerald-800">On</span>
          : <span className="rounded-full bg-brand-900/8 px-2 py-0.5 text-xs font-semibold text-muted">Off</span>}
      </p>
      <p className="text-sm text-muted">
        {enabled
          ? "After your password, you also enter a code from your authenticator app."
          : "Add a code from an authenticator app on your phone to every sign-in, so a stolen password is not enough."}
        {required && " Required for admin and staff accounts."}
      </p>
      <div className="flex flex-wrap gap-3">
        {enabled ? (
          <>
            <Button type="button" variant="glass" onClick={() => start("codes")}>New backup codes</Button>
            {!required && <Button type="button" variant="ghost" onClick={() => start("disable")}>Turn off</Button>}
          </>
        ) : (
          <Button type="button" onClick={() => start("enable")}>Set up two-step sign-in</Button>
        )}
      </div>
    </div>
  );
}

export type DeviceSession = { token: string; device: string; mobile: boolean; ip: string | null; lastActive: string; current: boolean };

export function Devices({ sessions }: { sessions: DeviceSession[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const others = sessions.filter((s) => !s.current).length;

  async function revoke(token: string | "others") {
    setBusy(token);
    const { error } = token === "others" ? await authClient.revokeOtherSessions() : await authClient.revokeSession({ token });
    setBusy(null);
    if (error) return toast(error.message ?? "Could not sign that device out.", "error");
    toast(token === "others" ? "Other devices signed out" : "Device signed out");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <ul className="divide-y divide-brand-900/10">
        {sessions.map((s) => (
          <li key={s.token} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {s.device}
                {s.current && <span className="ml-2 rounded-full bg-emerald-500/12 px-2 py-0.5 text-xs font-semibold text-emerald-800">This device</span>}
              </p>
              <p className="text-xs text-muted">
                {s.mobile ? "Mobile" : "Computer"}
                {s.ip && ` · ${s.ip}`} · Signed in or active {s.lastActive}
              </p>
            </div>
            {!s.current && (
              <Button type="button" variant="ghost" size="sm" disabled={busy !== null} onClick={() => revoke(s.token)}>
                {busy === s.token ? "Signing out…" : "Sign out"}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {others > 0 && (
        <Button type="button" variant="glass" disabled={busy !== null} onClick={() => revoke("others")} className="justify-self-start">
          {busy === "others" ? "Signing out…" : "Sign out all other devices"}
        </Button>
      )}
    </div>
  );
}

export function DeleteAccount({ hasPassword }: { hasPassword: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setPending(true);
    const { error } = await authClient.deleteUser(hasPassword ? { password: field(form, "password") } : {});
    setPending(false);
    if (error) {
      setError(
        error.code === "SESSION_EXPIRED"
          ? "For safety, please sign out, sign in again and then close your account."
          : error.code === "INVALID_PASSWORD" ? "That password is not right." : error.message ?? "Could not close your account.",
      );
      return;
    }
    // A full reload, so nothing from the deleted account stays in the client cache.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
  }

  if (!open) {
    return (
      <div className="grid gap-3">
        <p className="text-sm text-muted">Deletes your account, profile and uploaded documents. This cannot be undone.</p>
        <Button type="button" variant="ghost" onClick={() => setOpen(true)} className="justify-self-start text-red-700 hover:bg-red-500/10">
          Close my account
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <p className="text-sm text-red-800">Your account, profile and documents will be deleted for good.</p>
      {hasPassword && (
        <div>
          <Label htmlFor="del-password">Password</Label>
          <PasswordInput id="del-password" name="password" autoComplete="current-password" required />
        </div>
      )}
      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" required className="mt-0.5 size-4 accent-red-600" />
        I understand this cannot be undone.
      </label>
      <Alert>{error}</Alert>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="h-11 rounded-full bg-red-600 px-6 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
          {pending ? "Closing…" : "Close my account for good"}
        </button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
