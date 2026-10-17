"use client";

import { createContext, Suspense, use, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import type { AuthMode } from "@/components/auth/auth-form";
import { Drawer } from "@/components/ui/drawer";

type AuthRequest = { mode: AuthMode; next?: string };

const AuthDrawerContext = createContext<((request: AuthRequest) => void) | null>(null);

// Opens the sign in / sign up panel from any client component:
//   const openAuth = useAuthDrawer();
//   openAuth({ mode: "register", next: "/apply/some-course" });
export function useAuthDrawer() {
  const open = use(AuthDrawerContext);
  if (!open) throw new Error("useAuthDrawer must be used inside AuthDrawerProvider");
  return open;
}

// Only allow redirects back into this site.
function safeNext(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export function AuthDrawerProvider({
  googleEnabled,
  resetEnabled,
  children,
}: {
  googleEnabled: boolean;
  resetEnabled: boolean;
  children: ReactNode;
}) {
  const [request, setRequest] = useState<AuthRequest | null>(null);

  return (
    <AuthDrawerContext value={setRequest}>
      {children}
      {/* Reads ?auth= from the URL, which is only known at request time. */}
      <Suspense>
        <AuthDrawer request={request} onClose={() => setRequest(null)} googleEnabled={googleEnabled} resetEnabled={resetEnabled} />
      </Suspense>
    </AuthDrawerContext>
  );
}

function AuthDrawer({
  request,
  onClose,
  googleEnabled,
  resetEnabled,
}: {
  request: AuthRequest | null;
  onClose: () => void;
  googleEnabled: boolean;
  resetEnabled: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Set when the person switches between sign in and sign up inside the panel.
  const [switchedMode, setSwitchedMode] = useState<AuthMode | null>(null);

  // A link such as /?auth=login&next=/dashboard also opens the panel; protected pages
  // redirect here when nobody is signed in.
  const urlAuth = searchParams.get("auth");
  const fromUrl: AuthRequest | null =
    urlAuth === "login" || urlAuth === "register"
      ? { mode: urlAuth, next: searchParams.get("next") ?? undefined }
      : null;

  const active = request ?? fromUrl;
  const mode = switchedMode ?? active?.mode ?? "login";
  const next = safeNext(active?.next);
  // Set by Better Auth when Google sign-in fails and sends the person back here.
  const oauthError = fromUrl ? searchParams.get("error") : null;

  function close() {
    onClose();
    setSwitchedMode(null);
    if (fromUrl) router.replace(pathname, { scroll: false });
  }

  function onSuccess() {
    onClose();
    setSwitchedMode(null);
    router.push(next);
    router.refresh();
  }

  return (
    <Drawer
      open={active !== null}
      onClose={close}
      title={mode === "login" ? "Welcome back" : "Create your account"}
      description={
        mode === "login"
          ? "Sign in to continue."
          : "Apply to universities and track your applications in one place."
      }
    >
      <AuthForm
        mode={mode}
        onModeChange={setSwitchedMode}
        onSuccess={onSuccess}
        callbackURL={next}
        oauthError={oauthError}
        googleEnabled={googleEnabled}
        resetEnabled={resetEnabled}
      />
    </Drawer>
  );
}

type AuthTriggerProps = Omit<ComponentProps<"button">, "onClick"> & AuthRequest;

// A button that opens the panel; usable from server components.
export function AuthTrigger({ mode, next, ...props }: AuthTriggerProps) {
  const openAuth = useAuthDrawer();
  return <button type="button" onClick={() => openAuth({ mode, next })} {...props} />;
}
