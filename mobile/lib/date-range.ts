// All "days" in the app are calendar days in the user's chosen time zone (see timezone.ts).
// Every function takes the zone explicitly and defaults to the app's current zone, so the
// pure calculations stay testable for any zone, including ones with daylight saving.
import { getAppTimeZone, timeZoneOffsetMs } from "./timezone";

const DAY_MS = 24 * 60 * 60 * 1000;

/** A local calendar day as "YYYY-MM-DD". */
export type DayKey = string;

export type DateRange = { start: string; end: string };

export type WeekRange = DateRange & {
  /** Monday to Sunday of the week. */
  days: DayKey[];
  /** Today's key, so callers can tell past days from days that haven't happened yet. */
  today: DayKey;
  timeZone: string;
};

function toTime(date: Date | string): number {
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) throw new Error(`Invalid date: ${String(date)}`);
  return time;
}

/** The instant as local wall-clock time, written in an ISO string. */
function localIso(date: Date | string, timeZone: string) {
  const time = toTime(date);
  return new Date(time + timeZoneOffsetMs(timeZone, time)).toISOString();
}

export function dayKey(date: Date | string, timeZone = getAppTimeZone()): DayKey {
  return localIso(date, timeZone).slice(0, 10);
}

/** "HH:MM" (24h) local time. */
export function timeOfDay(date: Date | string, timeZone = getAppTimeZone()): string {
  return localIso(date, timeZone).slice(11, 16);
}

export function addDays(day: DayKey, amount: number): DayKey {
  return new Date(Date.parse(`${day}T00:00:00Z`) + amount * DAY_MS).toISOString().slice(0, 10);
}

/** The first instant of a local day. Usually local midnight; later if a DST jump skips it. */
function startOfDay(day: DayKey, timeZone: string): number {
  const wallMidnight = Date.parse(`${day}T00:00:00Z`);
  let start = wallMidnight - timeZoneOffsetMs(timeZone, wallMidnight);
  // Re-check with the offset in force at the guessed instant (it differs across DST changes).
  for (let i = 0; i < 2; i++) start = wallMidnight - timeZoneOffsetMs(timeZone, start);
  if (dayKey(new Date(start), timeZone) === day) {
    // Midnight exists; step back in case an earlier instant is also on this day (DST fall-back).
    const earlier = start - 60 * 60 * 1000;
    return dayKey(new Date(earlier), timeZone) === day ? earlier : start;
  }
  // Midnight was skipped by a DST jump: the day starts at the first instant that belongs to it.
  let low = start;
  let high = start + 3 * 60 * 60 * 1000;
  while (high - low > 1000) {
    const middle = Math.floor((low + high) / 2);
    if (dayKey(new Date(middle), timeZone) === day) high = middle;
    else low = middle;
  }
  return high;
}

/** UTC instants for [start of day, start of next day), for `gte`/`lt` queries. */
export function getDayBounds(day: DayKey, timeZone = getAppTimeZone()): DateRange {
  return {
    start: new Date(startOfDay(day, timeZone)).toISOString(),
    end: new Date(startOfDay(addDays(day, 1), timeZone)).toISOString(),
  };
}

export function getTodayBounds(now = new Date(), timeZone = getAppTimeZone()): DateRange {
  return getDayBounds(dayKey(now, timeZone), timeZone);
}

/** Monday–Sunday local week. `weekOffset` 0 is this week, -1 last week, and so on. */
export function getWeek(weekOffset = 0, now = new Date(), timeZone = getAppTimeZone()): WeekRange {
  const today = dayKey(now, timeZone);
  const daysSinceMonday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const monday = addDays(today, 7 * weekOffset - daysSinceMonday);
  const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  return {
    days,
    today,
    timeZone,
    start: getDayBounds(days[0], timeZone).start,
    end: getDayBounds(days[6], timeZone).end,
  };
}
