export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Europe/Rome";

/** Today as YYYY-MM-DD in Bunny's timezone, not the server's. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(
    new Date(),
  );
}

export function formatDay(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}
