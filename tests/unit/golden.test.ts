import { describe, expect, it } from "vitest";
import { getTempleSemester } from "@/lib/calendar/semester";
import { DEMO_FIXTURES } from "@/lib/extraction/fixtures";
import { buildForecast } from "@/lib/forecast/forecast";
import { recommendStartDates } from "@/lib/forecast/recommend";
import { buildIcs } from "@/lib/forecast/ics";
import { getSemesterWeeks } from "@/lib/forecast/weeks";
import { extractionToPlan, toEngineItems } from "@/lib/plan/adapters";
import type { Course, PlanItem } from "@/lib/forecast/types";

const spring = getTempleSemester("spring-2027");
const courses: Course[] = [];
const items: PlanItem[] = [];
for (const [stem, fx] of Object.entries(DEMO_FIXTURES)) {
  const plan = extractionToPlan(fx, stem);
  courses.push(plan.course);
  items.push(...plan.items);
}
const engine = toEngineItems(items, courses);
const forecast = buildForecast(engine, getSemesterWeeks(spring));
const recs = recommendStartDates(engine, forecast, [], spring, "2026-11-06");
const rating = (n: number) => forecast.find((f) => f.week.weekNumber === n)!.rating;

describe("golden: 4 demo syllabi → Spring 2027 forecast", () => {
  it("Week 7 (Feb 22–28) is the only Storm week", () => {
    expect(rating(7)).toBe("storm");
    expect(forecast.filter((f) => f.rating === "storm").map((f) => f.week.weekNumber)).toEqual([7]);
  });
  it("exactly two Busy weeks: 4 and 12", () => {
    expect(forecast.filter((f) => f.rating === "busy").map((f) => f.week.weekNumber)).toEqual([4, 12]);
  });
  it("Week 8 is Spring Break and every other week is Clear", () => {
    expect(rating(8)).toBe("break");
    const clear = forecast.filter((f) => f.rating === "clear").map((f) => f.week.weekNumber);
    expect(clear).toEqual([1, 2, 3, 5, 6, 9, 10, 11, 13, 14, 15, 16, 17]);
  });
  it("Weeks 16–17 carry the Finals flag", () => {
    expect(forecast.filter((f) => f.hasFinals).map((f) => f.week.weekNumber)).toEqual([16, 17]);
  });
  it("all recommendations are dated after Nov 6, 2026", () => {
    expect(recs.length).toBeGreaterThanOrEqual(6);
    for (const r of recs) {
      expect(r.startDate).not.toBe("now");
      expect(r.startDate > "2026-11-06").toBe(true);
    }
  });
  it("recommends starting the research paper by Feb 12 (the landing-page story)", () => {
    const paper = engine.find((i) => i.title === "Research Paper")!;
    expect(recs.find((r) => r.itemId === paper.id)!.startDate).toBe("2027-02-12");
  });
  it("nothing is due on MLK Day or during Spring Break", () => {
    for (const i of engine) {
      if (!i.dueDate) continue;
      expect(i.dueDate).not.toBe("2027-01-18");
      expect(i.dueDate >= "2027-03-01" && i.dueDate <= "2027-03-07").toBe(false);
    }
  });
  it("the TBD item is undated and 'Week 7, Friday' resolved to Feb 26, 2027", () => {
    const portfolio = items.find((i) => i.title === "Final Portfolio")!;
    expect(portfolio.dueDate).toBeNull();
    expect(portfolio.dateSource).toBe("tbd");
    expect(items.find((i) => i.title === "Group Project Milestone")!.dueDate).toBe("2027-02-26");
  });
  it("course weights add up to 100% each", () => {
    for (const c of courses) {
      const total = items.filter((i) => i.courseId === c.id).reduce((s, i) => s + (i.weightPercent ?? 0), 0);
      expect(Math.round(total)).toBe(100);
    }
  });
  it("the .ics round-trips: every dated item and recommendation becomes an event", () => {
    const ics = buildIcs(engine, recs, spring, true, "2026-11-06");
    const events = ics.split("BEGIN:VEVENT").length - 1;
    const dated = engine.filter((i) => i.dueDate).length;
    expect(events).toBe(dated + recs.length + 2 + 2 + 3);
    expect(ics).toContain("SUMMARY:STAT 1001: Midterm Exam (25%)");
    expect(ics).toContain("SUMMARY:Start: BCOM 2100 Research Paper");
  });
});
