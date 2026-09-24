import { cookies } from "next/headers";
import { SESSION_COOKIE, isValidSessionToken } from "./session";

export async function hasSession(): Promise<boolean> {
  const jar = await cookies();
  return isValidSessionToken(jar.get(SESSION_COOKIE)?.value);
}

/** Returns a 401 to bail out with, or null when the request is allowed. */
export async function guardApi(): Promise<Response | null> {
  if (await hasSession()) return null;
  return Response.json({ error: "Not signed in" }, { status: 401 });
}
