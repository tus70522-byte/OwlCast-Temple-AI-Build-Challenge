import { describe, expect, it } from "vitest";
import { getCustomSemester, getTempleSemester } from "@/lib/calendar/semester";
import { getSemesterWeeks, resolveRelativeDate } from "@/lib/forecast/weeks";

const spring = getTempleSemester("spring-2027");
const fall = getTempleSemester("fall-2026");
const springWeeks = getSemesterWeeks(spring);
const fallWeeks = getSemesterWeeks(fall);
const wk = (weeks: typeof springWeeks, n: number) => weeks.find((w) => w.weekNumber === n)!;

describe("Spring 2027 weeks", () => {
  it("has exactly 17 Monday–Sunday weeks with the right boundaries", () => {
    expect(springWeeks).toHaveLength(17);
    expect(wk(springWeeks, 1)).toMatchObject({ start: "2027-01-11", end: "2027-01-17" });
    expect(wk(springWeeks, 7)).toMatchObject({ start: "2027-02-22", end: "2027-02-28" });
    expect(wk(springWeeks, 8)).toMatchObject({ start: "2027-03-01", end: "2027-03-07" });
    expect(wk(springWeeks, 16)).toMatchObject({ start: "2027-04-26", end: "2027-05-02" });
    expect(wk(springWeeks, 17)).toMatchObject({ start: "2027-05-03", end: "2027-05-09" });
  });
  it("Week 8 is the Spring Break week and no other week is a break", () => {
    expect(springWeeks.filter((w) => w.isBreak).map((w) => w.weekNumber)).toEqual([8]);
    expect(wk(springWeeks, 8).notes[0]).toContain("Spring Break");
  });
  it("Week 2 shows the MLK Day note", () => {
    expect(wk(springWeeks, 2).notes).toEqual(["No classes Mon, Jan 18 · Dr. Martin Luther King, Jr. Day"]);
    expect(wk(springWeeks, 2).isBreak).toBe(false);
  });
  it("Weeks 16–17 have the Finals flag", () => {
    expect(springWeeks.filter((w) => w.hasFinals).map((w) => w.weekNumber)).toEqual([16, 17]);
  });
  it("places deadlines on the matching week", () => {
    expect(wk(springWeeks, 2).deadlines.map((d) => d.date)).toEqual(["2027-01-19"]);
    expect(wk(springWeeks, 3).deadlines.map((d) => d.date)).toEqual(["2027-01-25"]);
    expect(wk(springWeeks, 16).deadlines[0].label).toContain("withdraw");
  });
});

describe("Fall 2026 weeks", () => {
  it("has exactly 17 weeks with the right boundaries", () => {
    expect(fallWeeks).toHaveLength(17);
    expect(wk(fallWeeks, 1)).toMatchObject({ start: "2026-08-24", end: "2026-08-30" });
    expect(wk(fallWeeks, 6)).toMatchObject({ start: "2026-09-28", end: "2026-10-04" });
    expect(wk(fallWeeks, 14)).toMatchObject({ start: "2026-11-23", end: "2026-11-29" });
    expect(wk(fallWeeks, 16)).toMatchObject({ start: "2026-12-07", end: "2026-12-13" });
    expect(wk(fallWeeks, 17)).toMatchObject({ start: "2026-12-14", end: "2026-12-20" });
  });
  it("Week 14 is a Break week (Fall Break + Thanksgiving)", () => {
    expect(fallWeeks.filter((w) => w.isBreak).map((w) => w.weekNumber)).toEqual([14]);
    expect(wk(fallWeeks, 14).notes[0]).toContain("Fall Break");
    expect(wk(fallWeeks, 14).notes[0]).toContain("Thanksgiving");
  });
  it("Week 3 has Labor Day and Week 6 shows Fall Wellness Day", () => {
    expect(wk(fallWeeks, 3).notes[0]).toContain("Labor Day");
    expect(wk(fallWeeks, 6).notes).toEqual(["No classes Fri, Oct 2 · Fall Wellness Day"]);
  });
  it("Weeks 16–17 have the Finals flag", () => {
    expect(fallWeeks.filter((w) => w.hasFinals).map((w) => w.weekNumber)).toEqual([16, 17]);
  });
});

describe("custom semesters", () => {
  it("builds weeks from arbitrary dates", () => {
    const weeks = getSemesterWeeks(getCustomSemester("2027-06-02", "2027-07-30"));
    expect(weeks[0].start).toBe("2027-05-31");
    expect(weeks.at(-1)!.end).toBe("2027-08-01");
    expect(weeks.every((w) => !w.isBreak && !w.hasFinals)).toBe(true);
  });
});

describe("relative 'Week N' dates", () => {
  it("'Week 9' with no day and no meeting days → that week's Friday", () => {
    expect(resolveRelativeDate(springWeeks, 9, null, null)).toEqual({ date: "2027-03-12", dayInferred: true });
  });
  it("'Week 9 Wednesday' → Wednesday of Week 9", () => {
    expect(resolveRelativeDate(springWeeks, 9, "Wed", null)).toEqual({ date: "2027-03-10", dayInferred: false });
  });
  it("'Week 9' with meeting days → the course's first meeting day", () => {
    expect(resolveRelativeDate(springWeeks, 9, null, ["Thu", "Tue"])).toEqual({ date: "2027-03-09", dayInferred: true });
  });
  it("returns null for weeks that don't exist", () => {
    expect(resolveRelativeDate(springWeeks, 30, null, null)).toBeNull();
  });
});
