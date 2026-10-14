import {
  bangkokDayKey,
  bangkokTime,
  getBangkokDayBounds,
  getBangkokWeek,
  getThailandTodayBounds,
} from "../date-range";

// Wednesday 2026-10-14, 12:00 in Bangkok.
const wednesday = new Date("2026-10-14T05:00:00Z");

describe("bangkokDayKey", () => {
  it("switches day at Bangkok midnight (17:00 UTC)", () => {
    expect(bangkokDayKey("2026-10-13T16:59:59.999Z")).toBe("2026-10-13");
    expect(bangkokDayKey("2026-10-13T17:00:00.000Z")).toBe("2026-10-14");
  });

  it("reads Postgres timestamptz strings", () => {
    expect(bangkokDayKey("2026-10-13T17:30:00+00:00")).toBe("2026-10-14");
    expect(bangkokDayKey("2026-10-13T17:30:00.123456+00:00")).toBe("2026-10-14");
  });

  it("rejects invalid dates", () => {
    expect(() => bangkokDayKey("not a date")).toThrow();
  });
});

describe("day bounds", () => {
  it("covers Bangkok 00:00 to the next 00:00", () => {
    expect(getBangkokDayBounds("2026-10-14")).toEqual({
      start: "2026-10-13T17:00:00.000Z",
      end: "2026-10-14T17:00:00.000Z",
    });
  });

  it("gives today's bounds for late-evening UTC times that are already tomorrow in Bangkok", () => {
    expect(getThailandTodayBounds(new Date("2026-10-14T20:00:00Z")).start).toBe(
      "2026-10-14T17:00:00.000Z",
    );
  });
});

describe("getBangkokWeek", () => {
  it("returns Monday to Sunday around today", () => {
    const week = getBangkokWeek(0, wednesday);
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
    expect(getBangkokWeek(0, new Date("2026-10-18T16:30:00Z")).days[0]).toBe("2026-10-12");
    expect(getBangkokWeek(0, new Date("2026-10-18T17:00:00Z")).days[0]).toBe("2026-10-19");
  });

  it("makes consecutive weeks meet with no gap or overlap", () => {
    const previous = getBangkokWeek(-1, wednesday);
    expect(previous.end).toBe(getBangkokWeek(0, wednesday).start);
    expect(previous.days[0]).toBe("2026-10-05");
  });

  it("handles month and year rollover", () => {
    expect(getBangkokWeek(0, new Date("2026-12-31T20:00:00Z")).days).toEqual([
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
    ]);
  });

  it("maps every instant in the query range to a day of the week, and nothing outside it", () => {
    const week = getBangkokWeek(0, wednesday);
    const start = Date.parse(week.start);
    const end = Date.parse(week.end);
    for (let time = start; time < end; time += 10 * 60 * 1000 - 1) {
      expect(week.days).toContain(bangkokDayKey(new Date(time)));
    }
    expect(week.days).not.toContain(bangkokDayKey(new Date(end)));
    expect(week.days).not.toContain(bangkokDayKey(new Date(start - 1)));
  });
});

describe("bangkokTime", () => {
  it("formats 24-hour Bangkok time", () => {
    expect(bangkokTime("2026-10-13T17:05:00Z")).toBe("00:05");
    expect(bangkokTime("2026-10-14T13:45:00+00:00")).toBe("20:45");
  });
});
