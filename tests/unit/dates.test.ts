import { afterAll, describe, expect, it } from "vitest";
import {
  addDays,
  dayOfWeek,
  diffDays,
  formatRange,
  formatShort,
  isValidISODate,
  mondayOf,
  toDate,
  toISO,
  todayISO,
} from "@/lib/dates";

const ZONES = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Pacific/Kiritimati", // UTC+14
  "Pacific/Pago_Pago", // UTC-11
  "Asia/Kolkata",
  "Australia/Lord_Howe", // 30-minute DST
];

describe("date helper never shifts a day across time zones", () => {
  const original = process.env.TZ;
  afterAll(() => {
    process.env.TZ = original;
  });

  for (const tz of ZONES) {
    it(`round-trips and computes correctly in ${tz}`, () => {
      process.env.TZ = tz;
      for (const iso of ["2027-01-11", "2027-03-14", "2026-11-01", "2027-02-28", "2028-02-29", "2026-12-31"]) {
        expect(toISO(toDate(iso))).toBe(iso);
      }
      expect(addDays("2027-03-13", 1)).toBe("2027-03-14"); // US DST start
      expect(addDays("2027-03-14", 1)).toBe("2027-03-15");
      expect(addDays("2026-11-01", 1)).toBe("2026-11-02"); // US DST end
      expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
      expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
      expect(diffDays("2027-01-11", "2027-05-04")).toBe(113);
      expect(dayOfWeek("2027-02-25")).toBe("Thu");
      expect(dayOfWeek("2027-01-18")).toBe("Mon");
      expect(mondayOf("2027-02-28")).toBe("2027-02-22");
      expect(formatShort("2027-02-25")).toBe("Thu, Feb 25");
      expect(formatRange("2027-04-26", "2027-05-02")).toBe("Apr 26–May 2");
      expect(formatRange("2027-02-22", "2027-02-28")).toBe("Feb 22–28");
    });
  }

  it("today is computed in America/New_York", () => {
    // 2026-11-04 03:30 UTC is still Nov 3 in New York.
    expect(todayISO(new Date("2026-11-04T03:30:00Z"))).toBe("2026-11-03");
    expect(todayISO(new Date("2026-11-04T05:30:00Z"))).toBe("2026-11-04");
  });

  it("validates calendar dates", () => {
    expect(isValidISODate("2027-02-29")).toBe(false);
    expect(isValidISODate("2028-02-29")).toBe(true);
    expect(isValidISODate("2027-13-01")).toBe(false);
    expect(isValidISODate("Feb 25")).toBe(false);
    expect(isValidISODate(null)).toBe(false);
  });
});
