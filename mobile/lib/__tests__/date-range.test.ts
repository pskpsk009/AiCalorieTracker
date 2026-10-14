import { addDays, dayKey, getDayBounds, getTodayBounds, getWeek, timeOfDay } from "../date-range";

const BKK = "Asia/Bangkok";
// Wednesday 2026-10-14, 12:00 in Bangkok.
const wednesday = new Date("2026-10-14T05:00:00Z");

describe("dayKey (Bangkok, UTC+7)", () => {
  it("switches day at local midnight (17:00 UTC)", () => {
    expect(dayKey("2026-10-13T16:59:59.999Z", BKK)).toBe("2026-10-13");
    expect(dayKey("2026-10-13T17:00:00.000Z", BKK)).toBe("2026-10-14");
  });

  it("reads Postgres timestamptz strings", () => {
    expect(dayKey("2026-10-13T17:30:00+00:00", BKK)).toBe("2026-10-14");
    expect(dayKey("2026-10-13T17:30:00.123456+00:00", BKK)).toBe("2026-10-14");
  });

  it("rejects invalid dates", () => {
    expect(() => dayKey("not a date", BKK)).toThrow();
  });
});

describe("the same instant in different zones", () => {
  it("lands on the local calendar day of each zone", () => {
    const instant = "2026-10-14T02:00:00Z";
    expect(dayKey(instant, "Asia/Bangkok")).toBe("2026-10-14"); // 09:00
    expect(dayKey(instant, "America/New_York")).toBe("2026-10-13"); // 22:00 the day before
    expect(dayKey(instant, "Asia/Kolkata")).toBe("2026-10-14"); // 07:30
    expect(timeOfDay(instant, "Asia/Kolkata")).toBe("07:30");
  });
});

describe("day bounds", () => {
  it("covers Bangkok 00:00 to the next 00:00", () => {
    expect(getDayBounds("2026-10-14", BKK)).toEqual({
      start: "2026-10-13T17:00:00.000Z",
      end: "2026-10-14T17:00:00.000Z",
    });
  });

  it("gives today's bounds for late-evening UTC times that are already tomorrow locally", () => {
    expect(getTodayBounds(new Date("2026-10-14T20:00:00Z"), BKK).start).toBe(
      "2026-10-14T17:00:00.000Z",
    );
  });

  it("is 23 hours on a spring-forward day and 25 on a fall-back day (New York)", () => {
    const hours = (day: string) => {
      const { start, end } = getDayBounds(day, "America/New_York");
      return (Date.parse(end) - Date.parse(start)) / 3_600_000;
    };
    expect(hours("2026-03-08")).toBe(23);
    expect(hours("2026-11-01")).toBe(25);
    expect(hours("2026-07-01")).toBe(24);
  });

  // For every day of 2026 in zones with DST, half-hour offsets and the southern hemisphere:
  // the day starts at its first instant and ends exactly where the next day starts.
  it.each([
    "Asia/Bangkok",
    "America/New_York",
    "Europe/London",
    "Australia/Sydney",
    "Asia/Kolkata",
    "Asia/Kathmandu",
    "America/Santiago",
    "Pacific/Auckland",
  ])("has exact, gap-free day boundaries all year in %s", (timeZone) => {
    for (let day = "2026-01-01"; day < "2027-01-01"; day = addDays(day, 1)) {
      const { start, end } = getDayBounds(day, timeZone);
      const startTime = Date.parse(start);
      expect(dayKey(new Date(startTime), timeZone)).toBe(day);
      expect(dayKey(new Date(startTime - 1), timeZone)).toBe(addDays(day, -1));
      expect(end).toBe(getDayBounds(addDays(day, 1), timeZone).start);
    }
  });
});

describe("getWeek", () => {
  it("returns Monday to Sunday around today", () => {
    const week = getWeek(0, wednesday, BKK);
    expect(week.days).toEqual([
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
      "2026-10-18",
    ]);
    expect(week.today).toBe("2026-10-14");
    expect(week.start).toBe("2026-10-11T17:00:00.000Z");
    expect(week.end).toBe("2026-10-18T17:00:00.000Z");
  });

  it("keeps Sunday 23:30 in the same week and starts a new week at Monday 00:00", () => {
    expect(getWeek(0, new Date("2026-10-18T16:30:00Z"), BKK).days[0]).toBe("2026-10-12");
    expect(getWeek(0, new Date("2026-10-18T17:00:00Z"), BKK).days[0]).toBe("2026-10-19");
  });

  it("makes consecutive weeks meet with no gap or overlap", () => {
    const previous = getWeek(-1, wednesday, BKK);
    expect(previous.end).toBe(getWeek(0, wednesday, BKK).start);
    expect(previous.days[0]).toBe("2026-10-05");
  });

  it("handles month and year rollover", () => {
    expect(getWeek(0, new Date("2026-12-31T20:00:00Z"), BKK).days).toEqual([
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
    ]);
  });

  it("is 167 hours long in a week where the clocks go forward (London)", () => {
    const week = getWeek(0, new Date("2026-03-25T12:00:00Z"), "Europe/London");
    expect((Date.parse(week.end) - Date.parse(week.start)) / 3_600_000).toBe(167);
  });

  it("maps every instant in the query range to a day of the week, and nothing outside it", () => {
    const week = getWeek(0, wednesday, BKK);
    const start = Date.parse(week.start);
    const end = Date.parse(week.end);
    for (let time = start; time < end; time += 10 * 60 * 1000 - 1) {
      expect(week.days).toContain(dayKey(new Date(time), BKK));
    }
    expect(week.days).not.toContain(dayKey(new Date(end), BKK));
    expect(week.days).not.toContain(dayKey(new Date(start - 1), BKK));
  });
});

describe("timeOfDay", () => {
  it("formats 24-hour local time", () => {
    expect(timeOfDay("2026-10-13T17:05:00Z", BKK)).toBe("00:05");
    expect(timeOfDay("2026-10-14T13:45:00+00:00", BKK)).toBe("20:45");
  });
});
