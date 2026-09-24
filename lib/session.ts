import { SignJWT, jwtVerify } from "jose";
import { requireEnv } from "./env";

export const SESSION_COOKIE = "bunny_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

function secretKey() {
  return new TextEncoder().encode(requireEnv("SESSION_SECRET"));
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ sub: "bunny" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function isValidSessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
} as const;

/** Length-independent comparison so a wrong passcode leaks no timing signal. */
export function passcodeMatches(candidate: string): boolean {
  const expected = requireEnv("APP_PASSCODE");
  const a = new TextEncoder().encode(candidate);
  const b = new TextEncoder().encode(expected);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}
