import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createSessionToken,
  passcodeMatches,
  sessionCookieOptions,
} from "@/lib/session";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, { count: number; firstAt: number }>();

function tooManyAttempts(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (tooManyAttempts(ip)) {
    return NextResponse.json(
      { error: "Too many tries. Wait a few minutes." },
      { status: 429 },
    );
  }

  const { passcode } = (await request.json()) as { passcode?: string };
  if (!passcode || !passcodeMatches(passcode)) {
    return NextResponse.json({ error: "Wrong passcode" }, { status: 401 });
  }

  attempts.delete(ip);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions);
  return response;
}
