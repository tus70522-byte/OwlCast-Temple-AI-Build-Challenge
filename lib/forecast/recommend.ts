import { addDays, dayOfWeek, type DayOfWeek, type ISODate } from "@/lib/dates";
import { findNoClassDay, isFinalsDay, isStudyDay, type Semester } from "@/lib/calendar/semester";
import { LONG_SHIFT_HOURS, PREP_DAYS, SHIFT_MAX_MOVE_DAYS } from "./config";
import { isMajorItem } from "./forecast";
import { findWeek } from "./weeks";
import type { EngineItem, Recommendation, WeekForecast, WorkShift } from "./types";

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Shift hours per weekday (overnight shifts wrap past midnight). */
export function shiftHoursByDay(shifts: WorkShift[]): Map<DayOfWeek, number> {
  const out = new Map<DayOfWeek, number>();
  for (const s of shifts) {
    if (!s.start || !s.end) continue;
    let mins = minutes(s.end) - minutes(s.start);
    if (mins <= 0) mins += 24 * 60;
    out.set(s.day, (out.get(s.day) ?? 0) + mins / 60);
  }
  return out;
}

export function isFinalExam(item: Pick<EngineItem, "type" | "title">): boolean {
  return item.type === "exam" && /\bfinal\b/i.test(item.title);
}

const DEFAULT_REASON: Record<EngineItem["type"], string> = {
  exam: "A week of steady review beats one night of cramming.",
  project: "Projects take about two weeks of steady work.",
  paper: "Gives you 10 days to research, draft, and revise.",
  presentation: "A week to build your slides and rehearse.",
  quiz: "A couple of days to review.",
  lab: "A few days to prepare and write up.",
  homework: "A couple of days of lead time.",
  participation: "",
  other: "A few days of lead time.",
};

/**
 * Suggest a start date for every major item (weight >= MAJOR_ITEM_MIN_WEIGHT).
 * Rules, in order: ideal = due − PREP_DAYS; dodge Storm weeks other than the due week;
 * dodge long work days (max 3 days earlier); never on study/finals days unless the item
 * is a final; never before classes begin; before `today` → "now".
 */
export function recommendStartDates(
  items: EngineItem[],
  forecast: WeekForecast[],
  workShifts: WorkShift[],
  semester: Semester,
  today: ISODate,
): Recommendation[] {
  const weeks = forecast.map((f) => f.week);
  const ratingOf = (iso: ISODate) => forecast.find((f) => iso >= f.week.start && iso <= f.week.end);
  const hours = shiftHoursByDay(workShifts);
  const isLongDay = (iso: ISODate) => (hours.get(dayOfWeek(iso)) ?? 0) >= LONG_SHIFT_HOURS;

  const recs: Recommendation[] = [];
  for (const item of items) {
    if (!item.dueDate || !isMajorItem(item)) continue;
    const prep = PREP_DAYS[item.type];
    if (prep <= 0) continue;
    const dueWeek = findWeek(weeks, item.dueDate);
    if (!dueWeek) continue;
    const dueForecast = ratingOf(item.dueDate);

    let start = addDays(item.dueDate, -prep);
    let reason = DEFAULT_REASON[item.type];
    let primary: "default" | "storm-moved" | "due-storm" = "default";
    if (dueForecast?.rating === "storm") {
      primary = "due-storm";
      reason = `Week ${dueWeek.weekNumber} is a Storm week, so start before it hits.`;
    }

    // 1) Avoid starting inside a Storm week other than the item's own due week.
    const startFc = ratingOf(start);
    if (startFc && startFc.rating === "storm" && startFc.week.weekNumber !== dueWeek.weekNumber) {
      const earlier = forecast
        .filter((f) => f.week.end < startFc.week.start && f.rating !== "storm")
        .at(-1);
      if (earlier) {
        start = earlier.week.end;
        primary = "storm-moved";
        reason = `Week ${startFc.week.weekNumber} is a Storm week, so start before it hits.`;
      }
    }

    // 2) Avoid long work days (move back up to 3 days).
    let shiftNote = "";
    if (isLongDay(start)) {
      for (let k = 1; k <= SHIFT_MAX_MOVE_DAYS; k++) {
        const candidate = addDays(start, -k);
        if (!isLongDay(candidate)) {
          shiftNote = `Moved earlier to avoid your long ${dayOfWeek(start)} shift.`;
          start = candidate;
          break;
        }
      }
    }

    // 3) Never on a study day or finals day unless the item itself is a final.
    if (!isFinalExam(item)) {
      let guard = 0;
      while ((isStudyDay(semester, start) || isFinalsDay(semester, start)) && guard++ < 21) {
        start = addDays(start, -1);
      }
    }

    // 4) Never before classes begin.
    if (start < semester.classesBegin) start = semester.classesBegin;

    // Reason for break-day starts.
    const noClass = findNoClassDay(semester, start);
    if (noClass && primary !== "storm-moved") {
      reason = `Use ${noClass.label} to get ahead.`;
    }
    if (shiftNote) reason = primary === "default" && !noClass ? shiftNote : `${reason} ${shiftNote}`;

    // 5) Already past → start now.
    const startDate: ISODate | "now" = start < today ? "now" : start;
    if (startDate === "now") reason = `It's due ${item.dueDate > today ? "soon" : "now"}, so begin today.`;

    recs.push({ itemId: item.id, startDate, reason, dueWeek: dueWeek.weekNumber });
  }
  return recs.sort((a, b) => {
    const da = a.startDate === "now" ? "0" : a.startDate;
    const db = b.startDate === "now" ? "0" : b.startDate;
    return da < db ? -1 : da > db ? 1 : 0;
  });
}
