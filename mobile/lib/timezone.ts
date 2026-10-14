// Time zone helpers. Pure (no Supabase), so they can be unit-tested directly.

/** Used when neither the profile nor the device gives a usable zone. */
export const DEFAULT_TIME_ZONE = "Asia/Bangkok";

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** The zone the phone is set to (phones set this automatically from the network/location). */
export function getDeviceTimeZone(): string | null {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timeZone && isValidTimeZone(timeZone) ? timeZone : null;
  } catch {
    return null;
  }
}

// The zone every date calculation uses unless told otherwise. Kept in sync with the
// signed-in user's profile by AppStateProvider.
let appTimeZone = getDeviceTimeZone() ?? DEFAULT_TIME_ZONE;

export const getAppTimeZone = () => appTimeZone;

export function setAppTimeZone(timeZone: string) {
  if (!isValidTimeZone(timeZone)) throw new Error(`Unknown time zone: ${timeZone}`);
  appTimeZone = timeZone;
}

const formatters = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(timeZone: string) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** How far `timeZone` is ahead of UTC at `instant` (ms), including daylight saving. */
export function timeZoneOffsetMs(timeZone: string, instant: number): number {
  const parts = partsFormatter(timeZone).formatToParts(new Date(instant));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const wallClockAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24, // some engines print midnight as "24"
    get("minute"),
    get("second"),
  );
  return wallClockAsUtc - Math.floor(instant / 1000) * 1000;
}

/** "UTC+7", "UTC+5:30", "UTC−3", "UTC". */
export function formatUtcOffset(timeZone: string, instant = Date.now()): string {
  const minutes = Math.round(timeZoneOffsetMs(timeZone, instant) / 60000);
  if (minutes === 0) return "UTC";
  const sign = minutes > 0 ? "+" : "−";
  const hours = Math.floor(Math.abs(minutes) / 60);
  const rest = Math.abs(minutes) % 60;
  return `UTC${sign}${hours}${rest ? `:${String(rest).padStart(2, "0")}` : ""}`;
}

/** "Asia/Ho_Chi_Minh" → "Ho Chi Minh". */
export function timeZoneCity(timeZone: string): string {
  return (timeZone.split("/").pop() ?? timeZone).replace(/_/g, " ");
}

/** Curated list for manual selection. The device button can still pick any valid zone. */
export const TIME_ZONE_REGIONS: { region: string; zones: string[] }[] = [
  {
    region: "Asia",
    zones: [
      "Asia/Bangkok",
      "Asia/Yangon",
      "Asia/Phnom_Penh",
      "Asia/Vientiane",
      "Asia/Ho_Chi_Minh",
      "Asia/Jakarta",
      "Asia/Kuala_Lumpur",
      "Asia/Singapore",
      "Asia/Manila",
      "Asia/Hong_Kong",
      "Asia/Shanghai",
      "Asia/Taipei",
      "Asia/Seoul",
      "Asia/Tokyo",
      "Asia/Kolkata",
      "Asia/Kathmandu",
      "Asia/Dhaka",
      "Asia/Karachi",
      "Asia/Dubai",
      "Asia/Riyadh",
      "Asia/Tehran",
      "Asia/Jerusalem",
    ],
  },
  {
    region: "Europe",
    zones: [
      "Europe/London",
      "Europe/Dublin",
      "Europe/Lisbon",
      "Europe/Paris",
      "Europe/Amsterdam",
      "Europe/Berlin",
      "Europe/Madrid",
      "Europe/Rome",
      "Europe/Stockholm",
      "Europe/Warsaw",
      "Europe/Athens",
      "Europe/Istanbul",
      "Europe/Moscow",
    ],
  },
  {
    region: "Americas",
    zones: [
      "America/New_York",
      "America/Toronto",
      "America/Chicago",
      "America/Denver",
      "America/Phoenix",
      "America/Los_Angeles",
      "America/Vancouver",
      "America/Anchorage",
      "America/Mexico_City",
      "America/Bogota",
      "America/Lima",
      "America/Santiago",
      "America/Sao_Paulo",
      "America/Argentina/Buenos_Aires",
    ],
  },
  {
    region: "Africa",
    zones: [
      "Africa/Cairo",
      "Africa/Casablanca",
      "Africa/Lagos",
      "Africa/Nairobi",
      "Africa/Johannesburg",
    ],
  },
  {
    region: "Oceania",
    zones: [
      "Australia/Perth",
      "Australia/Adelaide",
      "Australia/Brisbane",
      "Australia/Sydney",
      "Australia/Melbourne",
      "Pacific/Auckland",
      "Pacific/Fiji",
      "Pacific/Honolulu",
    ],
  },
  { region: "UTC", zones: ["UTC"] },
];
