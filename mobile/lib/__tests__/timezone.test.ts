import {
  formatUtcOffset,
  isValidTimeZone,
  setAppTimeZone,
  getAppTimeZone,
  TIME_ZONE_REGIONS,
  timeZoneCity,
} from "../timezone";

describe("time zone helpers", () => {
  it("validates zone names", () => {
    expect(isValidTimeZone("Asia/Bangkok")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
  });

  it("formats UTC offsets, including half hours, negatives and DST", () => {
    const july = Date.parse("2026-07-01T00:00:00Z");
    const january = Date.parse("2026-01-15T00:00:00Z");
    expect(formatUtcOffset("Asia/Bangkok", july)).toBe("UTC+7");
    expect(formatUtcOffset("Asia/Kolkata", july)).toBe("UTC+5:30");
    expect(formatUtcOffset("Asia/Kathmandu", july)).toBe("UTC+5:45");
    expect(formatUtcOffset("America/New_York", january)).toBe("UTC−5");
    expect(formatUtcOffset("America/New_York", july)).toBe("UTC−4");
    expect(formatUtcOffset("UTC", july)).toBe("UTC");
  });

  it("turns zone names into city names", () => {
    expect(timeZoneCity("Asia/Ho_Chi_Minh")).toBe("Ho Chi Minh");
    expect(timeZoneCity("America/Argentina/Buenos_Aires")).toBe("Buenos Aires");
  });

  it("only lists zones the date engine understands", () => {
    for (const { zones } of TIME_ZONE_REGIONS) {
      for (const zone of zones) expect(isValidTimeZone(zone)).toBe(true);
    }
  });

  it("refuses to switch the app to an unknown zone", () => {
    const before = getAppTimeZone();
    expect(() => setAppTimeZone("Not/A_Zone")).toThrow();
    expect(getAppTimeZone()).toBe(before);
  });
});
