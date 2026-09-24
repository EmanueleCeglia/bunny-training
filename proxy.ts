import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSessionToken } from "@/lib/session";

// Optimistic gate only — every route handler re-checks the session itself.
export async function proxy(request: NextRequest) {
  const signedIn = await isValidSessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  const onLockScreen = request.nextUrl.pathname === "/lock";

  if (!signedIn && !onLockScreen) {
    return NextResponse.redirect(new URL("/lock", request.url));
  }
  if (signedIn && onLockScreen) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/).*)",
  ],
};
