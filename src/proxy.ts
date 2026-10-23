import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Fast first check only: sends visitors with no session cookie to the home page with the
// sign-in panel open. The real check (valid session, role, permissions) happens in
// src/lib/session.ts.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const login = new URL("/", request.url);
    login.searchParams.set("auth", "login");
    login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
