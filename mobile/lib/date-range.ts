// All "days" in the app are calendar days in Asia/Bangkok, which is UTC+7 all year (no DST),
// so a fixed offset gives exact boundaries without depending on the device timezone.
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** A Bangkok calendar day as "YYYY-MM-DD". */
export type DayKey = string;

export type DateRange = { start: string; end: string };

export type WeekRange = DateRange & {
  /** Monday to Sunday of the week. */
  days: DayKey[];
  /** Today's key, so callers can tell past days from days that haven't happened yet. */
  today: DayKey;
};

export function bangkokDayKey(date: Date | string): DayKey {
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) throw new Error(`Invalid date: ${String(date)}`);
  return new Date(time + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

/** "HH:MM" (24h) in Bangkok time. */
export function bangkokTime(date: Date | string): string {
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) throw new Error(`Invalid date: ${String(date)}`);
  return new Date(time + BANGKOK_OFFSET_MS).toISOString().slice(11, 16);
}

export function addDays(day: DayKey, amount: number): DayKey {
  return new Date(Date.parse(`${day}T00:00:00Z`) + amount * DAY_MS).toISOString().slice(0, 10);
}

/** UTC instants for [00:00, next 00:00) of a Bangkok day, for `gte`/`lt` queries. */
export function getBangkokDayBounds(day: DayKey): DateRange {
  const start = Date.parse(`${day}T00:00:00Z`) - BANGKOK_OFFSET_MS;
  return { start: new Date(start).toISOString(), end: new Date(start + DAY_MS).toISOString() };
}

export function getThailandTodayBounds(now = new Date()): DateRange {
  return getBangkokDayBounds(bangkokDayKey(now));
}

/** Monday–Sunday Bangkok week. `weekOffset` 0 is this week, -1 last week, and so on. */
export function getBangkokWeek(weekOffset = 0, now = new Date()): WeekRange {
  const today = bangkokDayKey(now);
  const daysSinceMonday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const monday = addDays(today, 7 * weekOffset - daysSinceMonday);
  const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  return {
    days,
    today,
    start: getBangkokDayBounds(days[0]).start,
    end: getBangkokDayBounds(days[6]).end,
  };
}
