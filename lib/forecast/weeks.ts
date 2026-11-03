import {
  addDays,
  DAY_NAMES,
  eachDay,
  formatShort,
  mondayOf,
  weekdayIndex,
  type DayOfWeek,
  type ISODate,
} from "@/lib/dates";
import { findNoClassDay, isFinalsDay, type Semester } from "@/lib/calendar/semester";
import type { SemesterWeek } from "./types";

/**
 * Calendar weeks (Mon–Sun). Week 1 is the week containing `classesBegin`;
 * the last week is the one containing `semesterEnd`.
 */
export function getSemesterWeeks(semester: Semester): SemesterWeek[] {
  const first = mondayOf(semester.classesBegin);
  const last = mondayOf(semester.semesterEnd);
  const weeks: SemesterWeek[] = [];
  let weekNumber = 1;
  for (let start = first; start <= last; start = addDays(start, 7), weekNumber++) {
    const end = addDays(start, 6);
    const days = eachDay(start, end);

    const noClassDays = days
      .map((date) => ({ date, range: findNoClassDay(semester, date) }))
      .filter((d): d is { date: ISODate; range: NonNullable<typeof d.range> } => Boolean(d.range))
      .map(({ date, range }) => ({ date, label: range.label }));

    const weekdays = days.slice(0, 5);
    const isBreak = weekdays.every((d) => noClassDays.some((n) => n.date === d));
    const finalsDays = days.filter((d) => isFinalsDay(semester, d));
    const studyDays = days.filter((d) => semester.studyDays.includes(d));
    const deadlines = semester.deadlines.filter((d) => d.date >= start && d.date <= end);

    weeks.push({
      weekNumber,
      start,
      end,
      noClassDays,
      isBreak,
      hasFinals: finalsDays.length > 0,
      finalsDays,
      studyDays,
      deadlines,
      notes: buildNotes(noClassDays, isBreak),
    });
  }
  return weeks;
}

function buildNotes(noClassDays: { date: ISODate; label: string }[], isBreak: boolean): string[] {
  // Group consecutive days by label.
  const groups: { label: string; dates: ISODate[] }[] = [];
  for (const d of noClassDays) {
    const g = groups.find((x) => x.label === d.label);
    if (g) g.dates.push(d.date);
    else groups.push({ label: d.label, dates: [d.date] });
  }
  if (isBreak) {
    return [`No classes this week · ${groups.map((g) => g.label).join(" and ")}`];
  }
  // Only list no-class days that fall Mon–Fri (weekends never have class anyway).
  return groups
    .map((g) => ({ ...g, dates: g.dates.filter((d) => weekdayIndex(d) < 5) }))
    .filter((g) => g.dates.length > 0)
    .map((g) => {
      const first = g.dates[0];
      const lastDate = g.dates[g.dates.length - 1];
      const when = first === lastDate ? formatShort(first) : `${formatShort(first)} – ${formatShort(lastDate)}`;
      return `No classes ${when} · ${g.label}`;
    });
}

export function findWeek(weeks: SemesterWeek[], iso: ISODate): SemesterWeek | undefined {
  return weeks.find((w) => iso >= w.start && iso <= w.end);
}

/**
 * Resolve a "Week N" date: use `dayOfWeek` if given, else the course's first meeting
 * day that week, else that week's Friday. Returns null if week N doesn't exist.
 */
export function resolveRelativeDate(
  weeks: SemesterWeek[],
  week: number,
  day: DayOfWeek | null,
  meetingDays: DayOfWeek[] | null,
): { date: ISODate; dayInferred: boolean } | null {
  const w = weeks.find((x) => x.weekNumber === week);
  if (!w) return null;
  let chosen: DayOfWeek;
  let dayInferred = true;
  if (day) {
    chosen = day;
    dayInferred = false;
  } else if (meetingDays && meetingDays.length > 0) {
    chosen = [...meetingDays].sort((a, b) => DAY_NAMES.indexOf(a) - DAY_NAMES.indexOf(b))[0];
  } else {
    chosen = "Fri";
  }
  return { date: addDays(w.start, DAY_NAMES.indexOf(chosen)), dayInferred };
}
