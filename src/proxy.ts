import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { siteUrl } from "@/lib/site-url";

// Fast first check only: sends visitors with no session cookie to the home page with the
// sign-in panel open. The real check (valid session, role, permissions) happens in
// src/lib/session.ts.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    // Built from APP_URL, not request.url: self-hosted (Railway), the request's perceived
    // origin is the app's own bind address, not the public domain.
    const login = new URL("/", siteUrl);
    login.searchParams.set("auth", "login");
    login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
