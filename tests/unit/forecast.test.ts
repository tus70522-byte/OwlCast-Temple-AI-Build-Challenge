import { describe, expect, it } from "vitest";
import { getTempleSemester } from "@/lib/calendar/semester";
import { buildForecast, itemLoad, rateWeek } from "@/lib/forecast/forecast";
import { getSemesterWeeks } from "@/lib/forecast/weeks";
import { getItemFlags } from "@/lib/forecast/flags";
import type { EngineItem, PlanItem } from "@/lib/forecast/types";

const spring = getTempleSemester("spring-2027");
const weeks = getSemesterWeeks(spring);

let n = 0;
function item(p: Partial<EngineItem>): EngineItem {
  return { id: `i${n++}`, title: "Item", type: "homework", weightPercent: null, dueDate: null, heavy: false, courseLabel: "TEST 1000", ...p };
}

describe("item load", () => {
  it("uses default weights when weight is null", () => {
    expect(itemLoad(item({ type: "exam" }))).toBe(20);
    expect(itemLoad(item({ type: "quiz" }))).toBe(3);
    expect(itemLoad(item({ type: "participation" }))).toBe(0);
  });
  it("uses the real weight when present", () => {
    expect(itemLoad(item({ type: "exam", weightPercent: 25 }))).toBe(25);
  });
  it("applies the heavy multiplier", () => {
    expect(itemLoad(item({ type: "paper", weightPercent: 10, heavy: true }))).toBe(15);
    expect(itemLoad(item({ type: "exam", heavy: true }))).toBe(30);
  });
});

describe("week ratings", () => {
  it("thresholds at, below, and above boundaries", () => {
    expect(rateWeek(9.9, 0, false)).toBe("clear");
    expect(rateWeek(10, 0, false)).toBe("busy");
    expect(rateWeek(10.1, 0, false)).toBe("busy");
    expect(rateWeek(24.9, 2, false)).toBe("busy");
    expect(rateWeek(25, 0, false)).toBe("storm");
    expect(rateWeek(40, 0, false)).toBe("storm");
    expect(rateWeek(0, 0, false)).toBe("clear");
  });
  it("Storm by major-item count", () => {
    expect(rateWeek(12, 3, false)).toBe("storm");
    expect(rateWeek(12, 2, false)).toBe("busy");
  });
  it("Break weeks are always Break", () => {
    expect(rateWeek(50, 4, true)).toBe("break");
  });
  it("buildForecast sums load per week and counts majors", () => {
    const items = [
      item({ type: "exam", weightPercent: 10, dueDate: "2027-02-22" }),
      item({ type: "paper", weightPercent: 10, dueDate: "2027-02-24" }),
      item({ type: "project", weightPercent: 10, dueDate: "2027-02-28" }),
      item({ type: "homework", weightPercent: 2.5, dueDate: "2027-02-01" }),
      item({ type: "homework", weightPercent: 2.5, dueDate: "2027-03-02" }), // in Spring Break
    ];
    const fc = buildForecast(items, weeks);
    const w7 = fc.find((f) => f.week.weekNumber === 7)!;
    expect(w7.load).toBe(30);
    expect(w7.majorCount).toBe(3);
    expect(w7.rating).toBe("storm");
    expect(fc.find((f) => f.week.weekNumber === 4)!.rating).toBe("clear");
    const w8 = fc.find((f) => f.week.weekNumber === 8)!;
    expect(w8.rating).toBe("break");
    expect(w8.items).toHaveLength(1); // still listed
    expect(fc.find((f) => f.week.weekNumber === 16)!.hasFinals).toBe(true);
  });
  it("rounds load to one decimal", () => {
    const fc = buildForecast(
      [item({ weightPercent: 3.33, dueDate: "2027-01-12" }), item({ weightPercent: 3.33, dueDate: "2027-01-13" }), item({ weightPercent: 3.33, dueDate: "2027-01-14" })],
      weeks,
    );
    expect(fc[0].load).toBe(10);
  });
});

describe("attention flags", () => {
  const base: Pick<PlanItem, "title" | "type" | "weightPercent" | "dueDate" | "dateSource" | "dayInferred" | "rawDateText" | "confidence" | "note"> = {
    title: "X",
    type: "paper",
    weightPercent: 10,
    dueDate: "2027-02-10",
    dateSource: "absolute",
    dayInferred: false,
    rawDateText: "Feb 10",
    confidence: "high",
    note: null,
  };
  it("no flags for a clean item", () => {
    expect(getItemFlags(base, spring)).toEqual([]);
  });
  it("flags TBD dates but not undated participation", () => {
    expect(getItemFlags({ ...base, dueDate: null, dateSource: "tbd", rawDateText: "TBD" }, spring)[0].code).toBe("tbd");
    expect(getItemFlags({ ...base, type: "participation", dueDate: null, dateSource: "tbd" }, spring)).toEqual([]);
  });
  it("flags a Week N date landing on a no-class day", () => {
    const f = getItemFlags({ ...base, dueDate: "2027-01-18", dateSource: "relative", dayInferred: true, rawDateText: "Week 2" }, spring);
    expect(f[0].code).toBe("no-class-day");
    expect(f[0].message).toBe("Calculated date falls on Dr. Martin Luther King, Jr. Day. Please check.");
  });
  it("flags an absolute date on Spring Break", () => {
    expect(getItemFlags({ ...base, dueDate: "2027-03-03" }, spring)[0].code).toBe("no-class-day");
  });
  it("flags inferred-day Week N dates, missing weights, low confidence, and out-of-semester dates", () => {
    expect(getItemFlags({ ...base, dateSource: "relative", dayInferred: true, rawDateText: "Week 4" }, spring)[0].code).toBe("calculated");
    expect(getItemFlags({ ...base, dateSource: "relative", dayInferred: false }, spring)).toEqual([]);
    expect(getItemFlags({ ...base, weightPercent: null }, spring)[0].code).toBe("missing-weight");
    expect(getItemFlags({ ...base, confidence: "low", note: "Two dates listed" }, spring)[0].message).toContain("Two dates listed");
    expect(getItemFlags({ ...base, dueDate: "2027-06-01" }, spring)[0].code).toBe("outside-semester");
  });
});
