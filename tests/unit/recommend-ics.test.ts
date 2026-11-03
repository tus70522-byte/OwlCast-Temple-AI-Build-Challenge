import { describe, expect, it } from "vitest";
import { getTempleSemester } from "@/lib/calendar/semester";
import { buildForecast } from "@/lib/forecast/forecast";
import { recommendStartDates } from "@/lib/forecast/recommend";
import { buildIcs } from "@/lib/forecast/ics";
import { getSemesterWeeks } from "@/lib/forecast/weeks";
import type { EngineItem, WorkShift } from "@/lib/forecast/types";

const spring = getTempleSemester("spring-2027");
const weeks = getSemesterWeeks(spring);
const TODAY = "2026-11-03";

let n = 0;
function item(p: Partial<EngineItem>): EngineItem {
  return { id: `r${n++}`, title: "Item", type: "exam", weightPercent: 20, dueDate: null, heavy: false, courseLabel: "TEST 1000", ...p };
}
function recs(items: EngineItem[], shifts: WorkShift[] = [], today = TODAY) {
  return recommendStartDates(items, buildForecast(items, weeks), shifts, spring, today);
}

describe("recommendStartDates", () => {
  it("basic case: due − prep days, only for major items", () => {
    const exam = item({ dueDate: "2027-02-11" }); // Thu
    const hw = item({ type: "homework", weightPercent: 2, dueDate: "2027-02-11" });
    const r = recs([exam, hw]);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ itemId: exam.id, startDate: "2027-02-04", dueWeek: 5 });
    expect(r[0].reason).toMatch(/review/);
  });

  it("moves a start out of a Storm week other than the due week", () => {
    // Make Week 7 a Storm week, then a project due in Week 9 whose ideal start (−14) lands in Week 7.
    const storm = [
      item({ dueDate: "2027-02-22" }),
      item({ dueDate: "2027-02-24" }),
      item({ dueDate: "2027-02-25" }),
    ];
    const project = item({ type: "project", weightPercent: 15, dueDate: "2027-03-10" }); // ideal start Feb 24
    const r = recs([...storm, project]).find((x) => x.itemId === project.id)!;
    expect(r.startDate).toBe("2027-02-21"); // last day of Week 6
    expect(r.reason).toBe("Week 7 is a Storm week, so start before it hits.");
  });

  it("items due in a Storm week explain why to start early", () => {
    const storm = [item({ dueDate: "2027-02-22" }), item({ dueDate: "2027-02-24" }), item({ dueDate: "2027-02-25" })];
    const r = recs(storm);
    expect(r.every((x) => x.reason === "Week 7 is a Storm week, so start before it hits.")).toBe(true);
  });

  it("avoids long work days (moves back up to 3 days)", () => {
    const exam = item({ dueDate: "2027-02-11" }); // ideal Thu Feb 4
    const shifts: WorkShift[] = [{ id: "s", day: "Thu", start: "10:00", end: "17:00", label: "Work" }];
    const r = recs([exam], shifts)[0];
    expect(r.startDate).toBe("2027-02-03");
    expect(r.reason).toContain("long Thu shift");
  });

  it("short shifts don't move the start", () => {
    const exam = item({ dueDate: "2027-02-11" });
    const shifts: WorkShift[] = [{ id: "s", day: "Thu", start: "10:00", end: "14:00", label: "Work" }];
    expect(recs([exam], shifts)[0].startDate).toBe("2027-02-04");
  });

  it("adds shift hours across multiple shifts on the same day", () => {
    const exam = item({ dueDate: "2027-02-11" });
    const shifts: WorkShift[] = [
      { id: "a", day: "Thu", start: "08:00", end: "11:00", label: "Job" },
      { id: "b", day: "Thu", start: "18:00", end: "21:00", label: "Job" },
    ];
    expect(recs([exam], shifts)[0].startDate).toBe("2027-02-03");
  });

  it("never lands on study or finals days unless the item is a final", () => {
    const quizLike = item({ type: "presentation", weightPercent: 15, title: "Capstone presentation", dueDate: "2027-05-08" }); // ideal May 1 (study day)
    const r = recs([quizLike])[0];
    expect(r.startDate).toBe("2027-04-26");
    const finalExam = item({ title: "Final Exam", dueDate: "2027-05-08" }); // ideal May 1 study day — allowed
    expect(recs([finalExam])[0].startDate).toBe("2027-05-01");
  });

  it("uses Spring Break to get ahead", () => {
    const exam = item({ dueDate: "2027-03-10" }); // ideal Mar 3 (Spring Break)
    const r = recs([exam])[0];
    expect(r.startDate).toBe("2027-03-03");
    expect(r.reason).toBe("Use Spring Break to get ahead.");
  });

  it("says 'Start now' when the ideal start has passed", () => {
    const exam = item({ dueDate: "2027-02-11" });
    const r = recs([exam], [], "2027-02-08")[0];
    expect(r.startDate).toBe("now");
  });

  it("never recommends before classes begin", () => {
    const project = item({ type: "project", weightPercent: 20, dueDate: "2027-01-15" }); // ideal Jan 1
    expect(recs([project])[0].startDate).toBe("2027-01-11");
  });
});

describe("buildIcs", () => {
  const items = [
    item({ title: "Midterm Exam", weightPercent: 25, dueDate: "2027-02-25", courseLabel: "MIS 2502" }),
    item({ type: "project", title: "Group Project", weightPercent: 20, dueDate: "2027-02-26", courseLabel: "MIS 2502" }),
    item({ type: "homework", title: "HW 1", weightPercent: 2, dueDate: "2027-01-22", courseLabel: "MIS 2502" }),
    item({ title: "Final", dueDate: null }),
  ];
  const r = recs(items);
  const count = (s: string) => (s.match(/BEGIN:VEVENT/g) ?? []).length;

  it("has the right event count without Temple events", () => {
    const ics = buildIcs(items, r, spring, false, TODAY);
    expect(count(ics)).toBe(3 + r.length);
    expect(r).toHaveLength(2);
  });
  it("adds no-class, finals, and deadline events with Temple events", () => {
    const ics = buildIcs(items, r, spring, true, TODAY);
    expect(count(ics)).toBe(3 + 2 + spring.noClassDays.length + spring.finals.length + spring.deadlines.length);
    expect(ics).toContain("SUMMARY:Temple: Spring Break");
  });
  it("formats titles and all-day dates correctly", () => {
    const ics = buildIcs(items, r, spring, true, TODAY);
    expect(ics).toContain("SUMMARY:MIS 2502: Midterm Exam (25%)");
    expect(ics).toContain("SUMMARY:Start: MIS 2502 Group Project");
    expect(ics).toContain("DTSTART;VALUE=DATE:20270225");
    expect(ics).toContain("DTEND;VALUE=DATE:20270226");
    // Spring Break spans Mar 1–7 inclusive → DTEND is Mar 8 (exclusive)
    expect(ics).toMatch(/SUMMARY:Temple: Spring Break[\s\S]*?DTSTART;VALUE=DATE:20270301[\s\S]*?DTEND;VALUE=DATE:20270308/);
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
  });
});
